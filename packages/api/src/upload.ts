import { authenticateUser } from './auth/auth-context';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function varintEncode(num: bigint): Uint8Array {
  const bytes = [];
  while (num > 127n) {
    bytes.push(Number((num & 127n) | 128n));
    num = num >> 7n;
  }
  bytes.push(Number(num));
  return new Uint8Array(bytes);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  let total = arrays.reduce((sum, a) => sum + a.length, 0);
  let result = new Uint8Array(total);
  let offset = 0;
  for (let a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function encodeUnixfs(type: number, data?: Uint8Array, filesize: bigint = 0n, blocksizes: bigint[] = []): Uint8Array {
  let parts: Uint8Array[] = [];
  parts.push(new Uint8Array([8]));
  parts.push(varintEncode(BigInt(type)));
  if (data) {
    parts.push(new Uint8Array([18]));
    parts.push(varintEncode(BigInt(data.length)));
    parts.push(data);
  }
  parts.push(new Uint8Array([24]));
  parts.push(varintEncode(filesize));
  for (let bs of blocksizes) {
    parts.push(new Uint8Array([32]));
    parts.push(varintEncode(bs));
  }
  return concat(parts);
}

function encodePBLink(link: {hash: Uint8Array, tsize: bigint, name?: string}): Uint8Array {
  let parts: Uint8Array[] = [];
  parts.push(new Uint8Array([10]));
  parts.push(varintEncode(BigInt(link.hash.length)));
  parts.push(link.hash);
  if (link.name) {
    const nameBytes = new TextEncoder().encode(link.name);
    parts.push(new Uint8Array([18]));
    parts.push(varintEncode(BigInt(nameBytes.length)));
    parts.push(nameBytes);
  }
  parts.push(new Uint8Array([24]));
  parts.push(varintEncode(link.tsize));
  return concat(parts);
}

function encodePBDag(links: {hash: Uint8Array, tsize: bigint, name?: string}[], data: Uint8Array): Uint8Array {
  let parts: Uint8Array[] = [];
  for (let link of links) {
    const encoded = encodePBLink(link);
    parts.push(new Uint8Array([10]));
    parts.push(varintEncode(BigInt(encoded.length)));
    parts.push(encoded);
  }
  parts.push(new Uint8Array([18]));
  parts.push(varintEncode(BigInt(data.length)));
  parts.push(data);
  return concat(parts);
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let output = '';
  let buffer = 0n;
  let bitsLeft = 0;
  for (let byte of bytes) {
    buffer = (buffer << 8n) | BigInt(byte);
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      bitsLeft -= 5;
      const index = Number((buffer >> BigInt(bitsLeft)) & 31n);
      output += alphabet[index];
    }
  }
  if (bitsLeft > 0) {
    const index = Number((buffer << BigInt(5 - bitsLeft)) & 31n);
    output += alphabet[index];
  }
  return output;
}

async function computeCID(content: Uint8Array): Promise<string> {
  const size = BigInt(content.length);
  const CHUNK_SIZE = 262144;
  let unixfsData: Uint8Array;
  let links: {hash: Uint8Array, tsize: bigint}[] = [];
  let blockSizes: bigint[] = [];

  if (content.length <= CHUNK_SIZE) {
    unixfsData = encodeUnixfs(2, content, size, [size]);
  } else {
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      chunks.push(content.slice(i, Math.min(i + CHUNK_SIZE, content.length)));
    }
    for (let chunk of chunks) {
      const hashBuf = await crypto.subtle.digest('SHA-256', chunk);
      const hashArr = new Uint8Array(hashBuf);
      const mh = new Uint8Array(34);
      mh[0] = 0x12;
      mh[1] = 0x20;
      mh.set(hashArr, 2);
      links.push({hash: mh, tsize: BigInt(chunk.length)});
      blockSizes.push(BigInt(chunk.length));
    }
    unixfsData = encodeUnixfs(2, undefined, size, blockSizes);
  }

  const pbData = encodePBDag(links, unixfsData);
  const pbHashBuf = await crypto.subtle.digest('SHA-256', pbData);
  const pbHash = new Uint8Array(pbHashBuf);
  const pbMh = new Uint8Array(34);
  pbMh[0] = 0x12;
  pbMh[1] = 0x20;
  pbMh.set(pbHash, 2);
  const cidBytes = new Uint8Array(36);
  cidBytes[0] = 1;
  cidBytes[1] = 0x70;
  cidBytes.set(pbMh, 2);
  const encoded = base32Encode(cidBytes);
  return 'b' + encoded;
}

export async function handleUpload(request: Request, env: Env, execContext: ExecutionContext): Promise<Response> {
  const context = await authenticateUser({ env, request });
  if (!context.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return new Response('No file provided', { status: 400 });
    }

    if (file.size > 150 * 1024 * 1024) {
      return new Response('File too large (max 150MB)', { status: 413 });
    }

    const content = new Uint8Array(await file.arrayBuffer());
    const cidStr = await computeCID(content);
    const key = `${cidStr}/index`;

    const s3 = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    await s3.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: content,
      ContentType: file.type || 'application/octet-stream',
    }));

    const response = {
      IpfsHash: cidStr,
      PinSize: content.length,
      Timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: { message: error.message || 'Upload failed' } }), { status: 500 });
  }
} 