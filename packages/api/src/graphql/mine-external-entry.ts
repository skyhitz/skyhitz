import axios from 'axios';
import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';
import { Context, Entry } from 'src/util/types';
import StorageClient from '../util/storage-client';
import StellarClient from '../stellar/operations';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
// Removed inline transcoding (ffmpeg/tmp/fs) due to Cloudflare Workers limits

type ExternalTrackInput = {
  id: string;
  title: string;
  artist?: string;
  genre?: string;
  source: 'audius' | 'soundxyz';
  url?: string;
  imageUrl?: string;
};

const ONE_XLM = 1.0;

async function fetchExternalAudioUrl(env: Env, extId: string): Promise<string | null> {
  // Reuse server-side resolver to resolve to a playable URL
  const { externalAudioUrlResolver } = await import('./search-external-music');
  return await externalAudioUrlResolver({}, { id: extId }, { env } as any);
}

function ensureAudiusImageMaxSize(url?: string): string | undefined {
  if (!url) return url;
  // Replace trailing /150x150.jpg style sizes with 1000x1000
  return url.replace(/\/(150x150|480x480)\.(jpg|jpeg|png|webp)$/i, '/1000x1000.$2');
}

export const mineExternalEntryResolver = async (_: any, { input }: { input: ExternalTrackInput }, ctx: Context) => {
  const user = requireAuth(ctx);
  const env = ctx.env;
  const algolia = new AlgoliaClient(env);
  const storage = new StorageClient(env);
  const stellar = new StellarClient(env);
  const contract = new ContractClient(env);
  const encryption = new Encryption(env);

  // 1) Balance check: require >= 1 XLM + fees available
  const { availableCredits } = await stellar.accountCredits(user.publicKey);
  // Require: base reserve (handled in availableCredits) + 1 XLM mine + ~0.2 buffer
  if (availableCredits < ONE_XLM + 0.2) {
    throw new GraphQLError('INSUFFICIENT_FUNDS');
  }

  // 2) Resolve external audio URL
  const audioUrl = await fetchExternalAudioUrl(env, input.id);
  if (!audioUrl) throw new GraphQLError('Could not resolve external audio url');

  // 3) Pin/Store media to R2 as-is (original format). R2 stores bytes at <cid>/index with content-type
  const pinnedAudio = await storage.pinAssetUrl(audioUrl);
  if (!pinnedAudio?.IpfsHash) throw new GraphQLError('Failed to pin audio');
  const imageUrlMax = input.source === 'audius' ? ensureAudiusImageMaxSize(input.imageUrl) : input.imageUrl;
  let pinnedImageHash: string | null = null;
  if (imageUrlMax) {
    const pinnedImage = await storage.pinAssetUrl(imageUrlMax);
    pinnedImageHash = pinnedImage?.IpfsHash || null;
  }

  // Leave transcoding (MP4/HLS) to async migration for now (migrate-videos.ts)

  // 4) Build metadata JSON and pin it; this cid is the entry id
  const metadata = {
    description: `${input.artist || ''} - ${input.title}`.trim(),
    external_url: input.url || '',
    image: pinnedImageHash ? `ipfs://${pinnedImageHash}` : '',
    name: input.title,
    image_hash: pinnedImageHash || '',
    animation_url: `ipfs://${pinnedAudio.IpfsHash}`,
    networks: {},
    source: input.source,
    sourceId: input.id,
  } as any;

  const metaCid = await storage.pinJSON(metadata);

  // 5) Compute mining partition and perform transfers
  // Highest APR -> investedEscrow = min(1 * apr% , 0.3)
  const topApr = await algolia.getTopApr().catch(() => 0);
  const investEscrow = Math.min((ONE_XLM * topApr) / 100, 0.3);
  const remaining = ONE_XLM - investEscrow;
  const half = remaining / 2;
  console.log('mine: partition', { topApr, investEscrow, half, user: user.publicKey, entry: metaCid, network: env.STELLAR_NETWORK });

  // Escrow invest (no equity if <= 0.3 per contract rules)
  const userSeed = await encryption.decrypt(user.seed);
  const toStroops = (lumens: number) => Math.round(lumens * 10_000_000);
  try {
    console.log('mine: invest escrow', { amount: toStroops(investEscrow) });
    await contract.invest(userSeed, metaCid, toStroops(investEscrow));
  } catch (e: any) {
    try {
      const msg = (e && (e.message || e.toString())) || 'unknown';
      console.log('First invest failed', msg);
      console.log('First invest error detail', JSON.stringify(e, Object.getOwnPropertyNames(e)));
    } catch {}
    throw new GraphQLError('INVEST_ESCROW_FAILED');
  }

  // Pay ISSUER_ID half
  try {
    console.log('mine: user pay', { to: env.ISSUER_ID, amount: half });
    await stellar.userPay(env.ISSUER_ID, half, userSeed);
  } catch (e: any) {
    try {
      const msg = (e && (e.message || e.toString())) || 'unknown';
      console.log('User payment failed', msg);
      console.log('User payment error detail', JSON.stringify(e, Object.getOwnPropertyNames(e)));
    } catch {}
    throw new GraphQLError('USER_PAYMENT_FAILED');
  }

  // Invest for equity with remaining half
  try {
    console.log('mine: invest equity', { amount: toStroops(half) });
    await contract.invest(userSeed, metaCid, toStroops(half));
  } catch (e: any) {
    try {
      const msg = (e && (e.message || e.toString())) || 'unknown';
      console.log('Equity invest failed', msg);
      console.log('Equity invest error detail', JSON.stringify(e, Object.getOwnPropertyNames(e)));
    } catch {}
    throw new GraphQLError('INVEST_EQUITY_FAILED');
  }

  // After successful on-chain ops, persist entry in Algolia
  const entry: Entry = {
    description: metadata.description,
    imageUrl: metadata.image,
    videoUrl: metadata.animation_url,
    title: input.title,
    id: metaCid,
    objectID: metaCid,
    artist: input.artist || '',
    publishedAt: new Date().toISOString(),
    publishedAtTimestamp: Math.floor(Date.now() / 1000),
    source: input.source,
    sourceId: input.id,
  } as any;

  await algolia.saveEntry(entry);

  // Update Algolia shares for the user based on on-chain state
  try {
    const chainEntry = await contract.getEntry(metaCid);
    try {
      let userShares = 0;
      const rawShares: any = (chainEntry as any)?.shares;
      if (Array.isArray(rawShares)) {
        const pair = rawShares.find((s: any) => s && s[0] === user.publicKey);
        userShares = pair ? Number(pair[1] || 0) : 0;
      } else if (rawShares && typeof rawShares.get === 'function') {
        const val = rawShares.get(user.publicKey);
        userShares = val ? Number(val) : 0;
      }
      await algolia.updateShares(metaCid, user.id, Number(userShares || 0));
    } catch (e) {
      console.log('update shares failed', e);
    }
    await algolia.partialUpdateEntry({
      objectID: metaCid,
      tvl: chainEntry.tvl,
      apr: chainEntry.apr,
      escrow: chainEntry.escrow,
    });
  } catch (e) {
    console.log('Post-index update failed', e);
  }

  return entry;
};


