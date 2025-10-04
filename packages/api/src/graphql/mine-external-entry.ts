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
  // NEW CONTRACT: We need to create the entry first, then perform actions
  const userSeed = await encryption.decrypt(user.seed);
  const toStroops = (lumens: number) => Math.round(lumens * 10_000_000);
  
  // STEP 1: Create entry in contract (required before any actions)
  try {
    console.log('⛏️  Creating entry in contract:', metaCid);
    await contract.createEntry(metaCid);
  } catch (e: any) {
    console.error('❌ Entry creation failed:', e);
    throw new GraphQLError('ENTRY_CREATION_FAILED');
  }

  // Calculate mining partition based on top APR
  const topApr = await algolia.getTopApr().catch(() => 0);
  const investEscrow = Math.min((ONE_XLM * topApr) / 100, 0.3);
  const remaining = ONE_XLM - investEscrow;
  const half = remaining / 2;
  
  console.log('⛏️  Mining partition:', { 
    topApr, 
    investEscrow: investEscrow.toFixed(2), 
    platformFee: half.toFixed(2),
    mineStake: half.toFixed(2),
    user: user.publicKey, 
    entry: metaCid 
  });

  // STEP 2: Escrow investment (adds to entry.escrow_xlm, no stake)
  // This goes to the escrow pool for performance-based rewards
  if (investEscrow > 0) {
    try {
      console.log('📊 Recording escrow invest:', toStroops(investEscrow), 'stroops');
      await contract.recordAction(userSeed, metaCid, 'invest', toStroops(investEscrow));
    } catch (e: any) {
      const msg = (e && (e.message || e.toString())) || 'unknown';
      console.error('❌ Escrow invest failed:', msg);
      throw new GraphQLError('INVEST_ESCROW_FAILED');
    }
  }

  // STEP 3: Pay platform fee to ISSUER_ID
  try {
    console.log('💰 Paying platform fee:', half, 'XLM to', env.ISSUER_ID);
    await stellar.userPay(env.ISSUER_ID, half, userSeed);
  } catch (e: any) {
    const msg = (e && (e.message || e.toString())) || 'unknown';
    console.error('❌ Platform payment failed:', msg);
    throw new GraphQLError('USER_PAYMENT_FAILED');
  }

  // STEP 4: Mine action (adds to entry.tvl_xlm, creates stake, earns HITZ rewards)
  // This is the key action that gives the user ownership and rewards
  try {
    console.log('⛏️  Recording mine action (stake):', toStroops(half), 'stroops');
    // Note: mine action has difficulty 10, which with base_fee 0.01 XLM = 0.1 XLM fee
    // But we're investing 'half' amount which should be ~0.35 XLM
    // So we use 'invest' with the half amount instead
    await contract.recordAction(userSeed, metaCid, 'invest', toStroops(half));
  } catch (e: any) {
    const msg = (e && (e.message || e.toString())) || 'unknown';
    console.error('❌ Mine/stake action failed:', msg);
    throw new GraphQLError('MINE_STAKE_FAILED');
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

  // Update Algolia with on-chain data (NEW CONTRACT INTERFACE)
  try {
    console.log('📈 Updating Algolia with on-chain data...');
    
    // Get entry data from contract
    const chainEntry = await contract.getEntry(metaCid);
    
    // Get entry stats (apr, reward pool, total staked)
    const stats = await contract.getEntryStats(metaCid);
    
    // Get user's stake (replaces old "shares" concept)
    const userStake = await contract.getStake(metaCid, user.publicKey);
    
    // Update user's stake in Algolia
    try {
      await algolia.updateShares(metaCid, user.id, Number(userStake));
      console.log('✅ User stake updated:', userStake, 'stroops');
    } catch (e) {
      console.error('❌ Failed to update user stake:', e);
    }
    
    // Update entry metrics in Algolia
    await algolia.partialUpdateEntry({
      objectID: metaCid,
      tvl: Number(chainEntry.tvl_xlm) / 10_000_000,      // NEW: tvl_xlm field
      escrow: Number(chainEntry.escrow_xlm) / 10_000_000, // NEW: escrow_xlm field
      apr: Number(stats.apr) / 100,                        // APR in basis points -> percentage
    });
    
    console.log('✅ Algolia updated:', {
      tvl: (Number(chainEntry.tvl_xlm) / 10_000_000).toFixed(2),
      escrow: (Number(chainEntry.escrow_xlm) / 10_000_000).toFixed(2),
      apr: (Number(stats.apr) / 100).toFixed(2) + '%',
    });
  } catch (e) {
    console.error('❌ Post-index update failed:', e);
    // Don't fail the whole operation if Algolia update fails
  }

  return entry;
};


