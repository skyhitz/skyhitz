import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

type PinRes = {
	IpfsHash: string;
	PinSize: number;
	Timestamp: string;
	isDuplicate: boolean;
};
const ipfsUrl = 'https://ipfs.io/ipfs';

function varintEncode(num: bigint): Uint8Array {
	const bytes: number[] = [];
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

function encodePBLink(link: { hash: Uint8Array; tsize: bigint; name?: string }): Uint8Array {
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

function encodePBDag(links: { hash: Uint8Array; tsize: bigint; name?: string }[], data: Uint8Array): Uint8Array {
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
	let links: { hash: Uint8Array; tsize: bigint }[] = [];
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
			links.push({ hash: mh, tsize: BigInt(chunk.length) });
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

class StorageClient {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	private detectContentType(content: Uint8Array, remoteType?: string): string {
		const type = (remoteType || '').toLowerCase();
		if (type && type !== 'application/octet-stream') return remoteType as string;

		let head = '';
		try {
			head = new TextDecoder('utf-8', { fatal: false }).decode(content.slice(0, 16));
		} catch {}

		if (head.startsWith('ID3')) return 'audio/mpeg';
		if (content.length > 2) {
			const b0 = content[0];
			const b1 = content[1];
			if (b0 === 0xff && (b1 === 0xfb || b1 === 0xf3 || b1 === 0xf2)) return 'audio/mpeg';
		}
		if (content.length > 12) {
			const sig = new TextDecoder('utf-8', { fatal: false }).decode(content.slice(4, 12));
			if (sig.includes('ftyp')) return 'video/mp4';
		}
		if (content.length > 12) {
			const riff = new TextDecoder('utf-8', { fatal: false }).decode(content.slice(0, 4));
			const wave = new TextDecoder('utf-8', { fatal: false }).decode(content.slice(8, 12));
			if (riff === 'RIFF' && wave === 'WAVE') return 'audio/wav';
		}
		if (head.startsWith('OggS')) return 'audio/ogg';
		if (head.startsWith('fLaC')) return 'audio/flac';
		if (head.startsWith('#EXTM3U')) return 'application/x-mpegURL';

		if (content.length > 4) {
			const s0 = content[0], s1 = content[1], s2 = content[2], s3 = content[3];
			if (s0 === 0x89 && s1 === 0x50 && s2 === 0x4e && s3 === 0x47) return 'image/png';
			if (s0 === 0xff && s1 === 0xd8 && s2 === 0xff) return 'image/jpeg';
			const head12 = new TextDecoder('ascii').decode(content.slice(0, 12));
			if (head12.startsWith('RIFF') && head12.slice(8, 12) === 'WEBP') return 'image/webp';
			const head3 = new TextDecoder('ascii').decode(content.slice(0, 3));
			if (head3 === 'GIF') return 'image/gif';
		}
		return remoteType || 'application/octet-stream';
	}

	private getS3() {
		return new S3Client({
			region: 'auto',
			endpoint: this.env.R2_ENDPOINT,
			credentials: {
				accessKeyId: this.env.R2_ACCESS_KEY_ID,
				secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
			},
		});
	}

	private async uploadToR2(cid: string, content: Uint8Array, contentType: string) {
		const s3 = this.getS3();
		const key = `${cid}/index`;
		await s3.send(
			new PutObjectCommand({
				Bucket: this.env.R2_BUCKET,
				Key: key,
				Body: content,
				ContentType: contentType || 'application/octet-stream',
			})
		);
		const res: PinRes = {
			IpfsHash: cid,
			PinSize: content.length,
			Timestamp: new Date().toISOString(),
			isDuplicate: false,
		};
		return res;
	}

	public async pinIpfsFile(ipfsHash: string, name: string): Promise<PinRes | null> {
		try {
			const url = `${ipfsUrl}/${ipfsHash}`;
			const response = await axios.get(url, { responseType: 'arraybuffer' });
			const content = new Uint8Array(response.data);
			const cid = await computeCID(content);
			const contentType = this.detectContentType(content, response.headers['content-type']);
			return await this.uploadToR2(cid, content, contentType);
		} catch (error) {
			console.log(error);
			return null;
		}
	}

	public async pinBuffer(buffer: Buffer): Promise<PinRes> {
		const content = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as any);
		const cid = await computeCID(content);
		return this.uploadToR2(cid, content, 'application/octet-stream');
	}

	public async pinData(data: FormData) {
		const file = data.get('file');
		if (!file || !(file instanceof Blob)) {
			throw new Error('No file provided');
		}
		const arrayBuf = new Uint8Array(await (file as Blob).arrayBuffer());
		const cid = await computeCID(arrayBuf);
		return this.uploadToR2(cid, arrayBuf, (file as Blob).type || 'application/octet-stream');
	}

	public async pinAssetUrl(url: string): Promise<PinRes> {
		console.log(url);
		const response = await axios.get(url, { responseType: 'arraybuffer' });
		const content = new Uint8Array(response.data);
		const cid = await computeCID(content);
		const contentType = this.detectContentType(content, response.headers['content-type']);
		return this.uploadToR2(cid, content, contentType);
	}

	public async pinJSON(centralizedMeta: any) {
		const json = JSON.stringify(centralizedMeta);
		const content = new TextEncoder().encode(json);
		const cid = await computeCID(content);
		await this.uploadToR2(cid, content, 'application/json');
		return cid;
	}

	public async pinExternalUrl(initial_url: string) {
		let url = '';
		if (initial_url.includes('ar://')) {
			url = initial_url.replace('ar://', 'https://arweave.net/');
		}

		const final_url = url ? url : initial_url;
		const res = await axios.head(final_url);

		if (res.status === 200) {
			// pin the url of the asset
			const { IpfsHash } = await this.pinAssetUrl(final_url);

			if (IpfsHash) {
				return IpfsHash;
			}
		}

		return null;
	}

	public async getIpfsHashForMedia(media: string) {
		var parts = media.split('/');

		if ((parts[parts.length - 2] && parts[parts.length - 2].includes('ipfs')) || parts[0].includes('ipfs:')) {
			return await this.findAndPinIpfsHash(parts);
		} else if (media) {
			const IpfsHash = await this.pinExternalUrl(media);

			if (IpfsHash) {
				return IpfsHash;
			}
		}
	}

	public async findAndPinIpfsHash(parts: string[]) {
		var ipfsHash = parts.pop() || parts.pop();
		if (!ipfsHash) return null;
		const res = await axios.head(`${ipfsUrl}/${ipfsHash}`);
		if (res.status === 200) {
			const pinned = await this.pinIpfsFile(ipfsHash, ipfsHash);
			return pinned?.IpfsHash || ipfsHash;
		}
	}
}

export default StorageClient;

