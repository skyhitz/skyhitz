import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';
import { Context, Entry, PendingMine } from 'src/util/types';
import StorageClient from '../util/storage-client';
import StellarClient from '../stellar/operations';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';
import { findSimilarTracks } from 'src/util/similarity';
import Mailer from 'src/postmark/mailer';

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
  const mailer = new Mailer(env);

  // 1) Balance check: require >= 1 XLM + fees available
  const { availableCredits } = await stellar.accountCredits(user.publicKey);
  // Require: base reserve (handled in availableCredits) + 1 XLM mine + ~0.2 buffer
  if (availableCredits < ONE_XLM + 0.2) {
    throw new GraphQLError('INSUFFICIENT_FUNDS');
  }

  // 2) Check for duplicates and similar tracks
  try {
    console.log('🔍 Checking for duplicates and similar tracks...');
    const allEntries = await algolia.getAllEntries();
    
    // First, check for exact match by source and sourceId
    const exactMatch = allEntries.find(
      (entry) => entry.source === input.source && entry.sourceId === input.id
    );

    if (exactMatch) {
      console.log(`✅ Found exact duplicate entry: ${exactMatch.id}`);
      console.log('⛏️  Mining existing entry instead of creating new one');
      
      const userSeed = await encryption.decrypt(user.seed);

      // Check if entry exists in contract, if not create it
      try {
        await contract.getEntry(exactMatch.id);
        console.log('✅ Entry already exists in contract');
      } catch (error) {
        console.log('⚠️  Entry not in contract, creating it first...');
        try {
          await contract.createEntry(exactMatch.id);
          console.log('✅ Entry created in contract');
        } catch (createError) {
          console.error('❌ Failed to create entry in contract:', createError);
          throw new GraphQLError('ENTRY_CREATION_FAILED');
        }
      }

      // Mine the existing entry (contract handles all fees and stakes)
      try {
        console.log('⛏️  Mining existing entry:', exactMatch.id);
        await contract.recordAction(userSeed, exactMatch.id, 'mine');
        console.log('✅ Mine action successful');
      } catch (e: any) {
        console.error('❌ Mine action failed:', e);
        throw new GraphQLError('MINE_FAILED');
      }

      // Update Algolia with new on-chain data
      try {
        console.log('📈 Updating Algolia with on-chain data...');

        const chainEntry = await contract.getEntry(exactMatch.id);
        const stats = await contract.getEntryStats(exactMatch.id);
        const userStake = await contract.getStake(exactMatch.id, user.publicKey);

        // Update user's stake for this entry
        await algolia.updateShares(exactMatch.id, user.id, Number(userStake));

        // Update entry metrics
        await algolia.partialUpdateEntry({
          objectID: exactMatch.id,
          tvl: Number(chainEntry.tvl_xlm) / 10_000_000,
          escrow: Number(chainEntry.escrow_xlm) / 10_000_000,
          apr: Number(stats.apr) / 100,
          totalStaked: Number(stats.totalStaked) / 10_000_000,
        });

        console.log('✅ Algolia updated:', {
          tvl: (Number(chainEntry.tvl_xlm) / 10_000_000).toFixed(2),
          escrow: (Number(chainEntry.escrow_xlm) / 10_000_000).toFixed(2),
          apr: (Number(stats.apr) / 100).toFixed(2) + '%',
          totalStaked: (Number(stats.totalStaked) / 10_000_000).toFixed(2) + ' HITZ',
        });
      } catch (e) {
        console.error('❌ Post-mine update failed:', e);
        // Don't fail the whole operation if Algolia update fails
      }

      console.log('✅ Successfully mined existing entry');
      
      // Return the existing entry (user successfully mined it)
      const updatedEntry = await algolia.getEntry(exactMatch.id);
      return updatedEntry;
    }

    // No exact duplicate found, check for similar tracks
    console.log('✅ No exact duplicate found, checking for similar tracks...');
    
    // Find similar tracks with 80% threshold (using same allEntries already fetched)
    const similarTracks = findSimilarTracks(
      {
        title: input.title,
        artist: input.artist,
        source: input.source,
        sourceId: input.id,
      },
      allEntries,
      0.80 // 80% similarity threshold
    );

    if (similarTracks.length > 0) {
      console.log(`⚠️  Found ${similarTracks.length} similar track(s), creating pending mine`);
      
      // Create pending mine record
      const pendingMineId = `pending-${Date.now()}-${user.id}`;
      const pendingMine: PendingMine = {
        objectID: pendingMineId,
        userId: user.id,
        userEmail: user.email,
        userName: user.displayName || user.username,
        track: {
          id: input.id,
          title: input.title,
          artist: input.artist,
          genre: input.genre,
          source: input.source,
          url: input.url,
          imageUrl: input.imageUrl,
        },
        similarTracks: similarTracks.slice(0, 5).map((st) => ({ // Top 5 similar tracks
          id: st.track.id,
          title: st.track.title,
          artist: st.track.artist,
          similarity: st.similarity,
        })),
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdAtTimestamp: Math.floor(Date.now() / 1000),
      };

      await algolia.savePendingMine(pendingMine);

      // Send email notification to admin
      try {
        await mailer.sendPendingMineNotification({
          userName: user.displayName || user.username,
          userEmail: user.email,
          trackTitle: input.title,
          trackArtist: input.artist,
          similarTracks: pendingMine.similarTracks,
          pendingMineId,
        });
        console.log('✅ Admin notification sent');
      } catch (emailError) {
        console.error('❌ Failed to send admin notification:', emailError);
        // Don't fail the whole operation if email fails
      }

      throw new GraphQLError('PENDING_REVIEW', {
        extensions: {
          code: 'PENDING_REVIEW',
          message: 'This track appears similar to existing content. An admin will review your submission.',
          pendingMineId,
          similarTracks: pendingMine.similarTracks,
        },
      });
    }

    console.log('✅ No similar tracks found, proceeding with mine');
  } catch (error) {
    // If it's a known GraphQL error (like PENDING_REVIEW), re-throw it
    if (error instanceof GraphQLError) {
      throw error;
    }
    // Log other errors but continue with mining
    console.error('❌ Error checking for duplicates/similar tracks:', error);
    // Continue with normal mining if duplicate check fails
  }

  // 4) Resolve external audio URL
  const audioUrl = await fetchExternalAudioUrl(env, input.id);
  if (!audioUrl) throw new GraphQLError('Could not resolve external audio url');

  // 5) Pin/Store media to R2 as-is (original format). R2 stores bytes at <cid>/index with content-type
  const pinnedAudio = await storage.pinAssetUrl(audioUrl);
  if (!pinnedAudio?.IpfsHash) throw new GraphQLError('Failed to pin audio');
  const imageUrlMax = input.source === 'audius' ? ensureAudiusImageMaxSize(input.imageUrl) : input.imageUrl;
  let pinnedImageHash: string | null = null;
  if (imageUrlMax) {
    const pinnedImage = await storage.pinAssetUrl(imageUrlMax);
    pinnedImageHash = pinnedImage?.IpfsHash || null;
  }

  // Leave transcoding (MP4/HLS) to async migration for now (migrate-videos.ts)

  // 6) Build metadata JSON and pin it; this cid is the entry id
  const metadata = {
    description: `${input.artist || ''} - ${input.title}`.trim(),
    external_url: input.url || '',
    image: pinnedImageHash ? `ipfs://${pinnedImageHash}` : '',
    name: `${input.artist || ''} - ${input.title}`.trim(), // FIX: name must be "artist - title" format for parsing
    image_hash: pinnedImageHash || '',
    animation_url: `ipfs://${pinnedAudio.IpfsHash}`,
    networks: {},
    source: input.source,
    sourceId: input.id,
  } as any;

  const metaCid = await storage.pinJSON(metadata);

  // 7) Perform mining operations
  const userSeed = await encryption.decrypt(user.seed);
  
  // STEP 1: Create entry in contract (required before any actions)
  try {
    console.log('⛏️  Creating entry in contract:', metaCid);
    await contract.createEntry(metaCid);
  } catch (e: any) {
    console.error('❌ Entry creation failed:', e);
    throw new GraphQLError('ENTRY_CREATION_FAILED');
  }

  // STEP 2: Mine the entry (contract handles all fees and stakes)
  try {
    console.log('⛏️  Mining entry:', metaCid);
    await contract.recordAction(userSeed, metaCid, 'mine');
    console.log('✅ Mine action successful');
  } catch (e: any) {
    const msg = (e && (e.message || e.toString())) || 'unknown';
    console.error('❌ Mine action failed:', msg);
    throw new GraphQLError('MINE_FAILED');
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
      totalStaked: Number(stats.totalStaked) / 10_000_000, // Total HITZ staked
    });
    
    console.log('✅ Algolia updated:', {
      tvl: (Number(chainEntry.tvl_xlm) / 10_000_000).toFixed(2),
      escrow: (Number(chainEntry.escrow_xlm) / 10_000_000).toFixed(2),
      apr: (Number(stats.apr) / 100).toFixed(2) + '%',
      totalStaked: (Number(stats.totalStaked) / 10_000_000).toFixed(2) + ' HITZ',
    });
  } catch (e) {
    console.error('❌ Post-index update failed:', e);
    // Don't fail the whole operation if Algolia update fails
  }

  return entry;
};


