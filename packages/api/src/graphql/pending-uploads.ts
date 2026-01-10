import { GraphQLError } from 'graphql';
import { requireAuth } from '../auth/auth-context';
import { AlgoliaClient } from '../algolia/algolia';
import { Context, Entry, PendingUpload } from '../util/types';
import StorageClient from '../util/storage-client';
import StellarClient from '../stellar/operations';
import ContractClient from '../../contract';
import Encryption from '../util/encryption';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { checkIsCurator } from './curators';

// Map 1-5 star rating to quality score (2, 4, 6, 8, 10)
export function starRatingToQualityScore(stars: number): number {
  if (stars < 1 || stars > 5) {
    throw new Error('Star rating must be between 1 and 5');
  }
  return stars * 2; // 1→2, 2→4, 3→6, 4→8, 5→10
}

// Calculate mint cost based on quality score
// Formula: MintCost(XLM) = 10^(1 - Q/10)
export function calculateMintCost(qualityScore: number): number {
  const cost = Math.pow(10, 1 - qualityScore / 10);
  return Math.max(0.1, Math.min(10, parseFloat(cost.toFixed(2))));
}

/**
 * Query resolver to get all pending uploads (curator only)
 */
export const pendingUploadsResolver = async (
  _: any,
  __: any,
  ctx: Context
): Promise<PendingUpload[]> => {
  const user = requireAuth(ctx);
  const algolia = new AlgoliaClient(ctx.env);

  // Only curators can view pending uploads
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can view pending uploads' },
    });
  }

  return await algolia.getAllPendingUploads();
};

/**
 * Query resolver to get pending uploads count (curator only)
 */
export const pendingUploadsCountResolver = async (
  _: any,
  __: any,
  ctx: Context
): Promise<number> => {
  const user = requireAuth(ctx);
  const algolia = new AlgoliaClient(ctx.env);

  // Only curators can view pending uploads count
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    return 0; // Non-curators see 0 count
  }

  return await algolia.getPendingUploadsCount();
};

/**
 * Query resolver to get a specific pending upload (curator only)
 */
export const pendingUploadResolver = async (
  _: any,
  { id }: { id: string },
  ctx: Context
): Promise<PendingUpload> => {
  const user = requireAuth(ctx);
  const algolia = new AlgoliaClient(ctx.env);

  // Only curators can view pending uploads
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can view pending uploads' },
    });
  }

  try {
    const pendingUpload = await algolia.getPendingUpload(id);
    return {
      ...pendingUpload,
    } as PendingUpload;
  } catch (error) {
    throw new GraphQLError('NOT_FOUND', {
      extensions: { code: 'NOT_FOUND', message: 'Pending upload not found' },
    });
  }
};

export interface ApprovePendingUploadInput {
  id: string;
  starRating: number; // 1-5
  isAiGenerated: boolean;
}

/**
 * Mutation resolver to approve a pending upload and create the entry
 * This performs the actual minting operation
 */
export const approvePendingUploadResolver = async (
  _: any,
  { input }: { input: ApprovePendingUploadInput },
  ctx: Context
): Promise<{ success: boolean; message: string; entry?: Entry }> => {
  const user = requireAuth(ctx);
  const env = ctx.env;
  const algolia = new AlgoliaClient(env);

  // Only curators can approve pending uploads
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can approve pending uploads' },
    });
  }

  const { id, starRating, isAiGenerated } = input;

  // Validate star rating
  if (starRating < 1 || starRating > 5) {
    throw new GraphQLError('INVALID_RATING', {
      extensions: { code: 'INVALID_RATING', message: 'Star rating must be between 1 and 5' },
    });
  }

  const storage = new StorageClient(env);
  const contract = new ContractClient(env);
  const encryption = new Encryption(env);

  // Get the pending upload
  let pendingUpload: PendingUpload;
  try {
    pendingUpload = await algolia.getPendingUpload(id);
  } catch (error) {
    throw new GraphQLError('NOT_FOUND', {
      extensions: { code: 'NOT_FOUND', message: 'Pending upload not found' },
    });
  }

  if (pendingUpload.status !== 'pending') {
    throw new GraphQLError('INVALID_STATUS', {
      extensions: {
        code: 'INVALID_STATUS',
        message: `Pending upload has already been ${pendingUpload.status}`,
      },
    });
  }

  // Get the original user who uploaded
  let originalUser;
  try {
    originalUser = await algolia.getUser(pendingUpload.userId);
  } catch (error) {
    throw new GraphQLError('USER_NOT_FOUND', {
      extensions: { code: 'USER_NOT_FOUND', message: 'Original uploader not found' },
    });
  }

  // Calculate quality score and mint cost from star rating
  const qualityScore = starRatingToQualityScore(starRating);
  const mintCost = calculateMintCost(qualityScore);

  try {
    // Check user balance
    const stellar = new StellarClient(env);
    const { availableXlmBalance } = await stellar.getXlmBalance(originalUser.publicKey);
    const requiredBalance = mintCost + 0.2; // mint cost + buffer for fees

    if (availableXlmBalance < requiredBalance) {
      throw new GraphQLError('INSUFFICIENT_FUNDS', {
        extensions: {
          code: 'INSUFFICIENT_FUNDS',
          required: requiredBalance,
          available: availableXlmBalance,
          message: `User has insufficient balance. Required: ${requiredBalance} XLM, Available: ${availableXlmBalance} XLM`,
        },
      });
    }

    // Generate entry ID
    const entryId = `upload-${crypto.randomUUID()}`;
    console.log(`🎵 Creating entry from approved upload: ${entryId}`);
    console.log(`   Title: ${pendingUpload.title}`);
    console.log(`   Artist: ${pendingUpload.artist}`);
    console.log(`   Star Rating: ${starRating}/5 → Quality Score: ${qualityScore}/10`);
    console.log(`   Mint Cost: ${mintCost} XLM`);
    console.log(`   AI Generated: ${isAiGenerated}`);

    // Prepare entry metadata
    const videoUrl = `ipfs://${pendingUpload.audioHash}`;
    const imageUrl = `ipfs://${pendingUpload.imageHash}`;

    const entryData = {
      objectID: entryId,
      id: entryId,
      title: pendingUpload.title,
      artist: pendingUpload.artist,
      description: pendingUpload.description || '',
      videoUrl,
      imageUrl,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Date.now(),
      userId: originalUser.id,
      userName: originalUser.displayName || originalUser.username,
      userAvatar: originalUser.avatarUrl || '',
      source: 'upload',
      qualityScore,
      mintCost,
      isAiGenerated,
      tvl: 0,
      escrow: 0,
      apr: 0,
      totalStaked: 0,
      likeCount: 0,
    };

    // Index entry in Algolia
    console.log('📊 Indexing entry in Algolia...');
    await algolia.saveEntry(entryData as any);
    console.log('✅ Entry indexed in Algolia');

    // Get user's decrypted seed for contract interaction
    const userSeed = await encryption.decrypt(originalUser.seed);

    // Create entry in contract
    console.log('📝 Creating entry in smart contract...');
    try {
      await contract.createEntry(entryId);
      console.log('✅ Entry created in contract');
    } catch (error: any) {
      console.error('❌ Contract entry creation failed:', error);
      // Cleanup Algolia entry
      await algolia.deleteEntry(entryId);
      throw new GraphQLError('Failed to create entry in smart contract');
    }

    // Record mine action with dynamic cost
    const mintCostStroops = Math.round(mintCost * 10_000_000);

    console.log(`⛏️  Recording mine action with ${mintCost} XLM (${mintCostStroops} stroops)...`);
    try {
      await contract.recordAction(userSeed, entryId, 'invest', mintCostStroops);
      console.log('✅ Mine action recorded');
    } catch (error: any) {
      console.error('❌ Mine action failed:', error);
      throw new GraphQLError('Failed to record mine action. Entry created but not minted.');
    }

    // Update Algolia with on-chain data
    console.log('📈 Updating Algolia with on-chain data...');
    try {
      const chainEntry = await contract.getEntry(entryId);
      const stats = await contract.getEntryStats(entryId);
      const userStake = await contract.getStake(entryId, originalUser.publicKey);

      await algolia.updateShares(entryId, originalUser.id, Number(userStake));

      await algolia.partialUpdateEntry({
        objectID: entryId,
        tvl: Number(chainEntry.tvl_xlm) / 10_000_000,
        escrow: Number(chainEntry.escrow_xlm) / 10_000_000,
        apr: Number(stats.apr) / 100,
        totalStaked: Number(stats.totalStaked) / 10_000_000,
      });

      console.log('✅ Algolia updated with on-chain data');
    } catch (error) {
      console.error('❌ Post-mint update failed:', error);
      // Don't fail the whole operation
    }

    // Set artist equity on contract if verified artist uploaded with equity
    if (pendingUpload.isVerifiedArtist && pendingUpload.artistEquityBps && pendingUpload.artistEquityBps > 0) {
      console.log(`🎨 Setting artist equity: ${pendingUpload.artistEquityBps} bps (${(pendingUpload.artistEquityBps / 100).toFixed(1)}%) for ${originalUser.publicKey}`);
      try {
        await contract.setArtistEquity(entryId, originalUser.publicKey, pendingUpload.artistEquityBps);
        console.log('✅ Artist equity set on contract');
      } catch (error) {
        console.error('❌ Failed to set artist equity on contract:', error);
        // Don't fail the whole operation - entry is already created
        // Artist equity can be set manually later if needed
      }
    }

    // Update pending upload status
    await algolia.updatePendingUploadStatus(id, 'approved', user.id, {
      qualityScore,
      isAiGenerated,
    });

    console.log('🎉 Successfully approved and minted upload!');

    return {
      success: true,
      message: 'Upload approved and track minted successfully!',
      entry: {
        id: entryId,
        title: pendingUpload.title,
        artist: pendingUpload.artist,
        description: pendingUpload.description || '',
        videoUrl,
        imageUrl,
      } as Entry,
    };
  } catch (error: any) {
    console.error('❌ Failed to approve pending upload:', error);

    if (error instanceof GraphQLError) {
      throw error;
    }

    throw new GraphQLError('APPROVAL_FAILED', {
      extensions: {
        code: 'APPROVAL_FAILED',
        message: error?.message || 'Failed to approve pending upload',
      },
    });
  }
};

/**
 * Mutation resolver to reject a pending upload (curator only)
 * This deletes the uploaded files from R2 storage
 */
export const rejectPendingUploadResolver = async (
  _: any,
  { id, reason }: { id: string; reason?: string },
  ctx: Context
): Promise<boolean> => {
  const user = requireAuth(ctx);
  const env = ctx.env;
  const algolia = new AlgoliaClient(env);

  // Only curators can reject pending uploads
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can reject pending uploads' },
    });
  }

  // Get the pending upload
  let pendingUpload: PendingUpload;
  try {
    pendingUpload = await algolia.getPendingUpload(id);
  } catch (error) {
    throw new GraphQLError('NOT_FOUND', {
      extensions: { code: 'NOT_FOUND', message: 'Pending upload not found' },
    });
  }

  if (pendingUpload.status !== 'pending') {
    throw new GraphQLError('INVALID_STATUS', {
      extensions: {
        code: 'INVALID_STATUS',
        message: `Pending upload has already been ${pendingUpload.status}`,
      },
    });
  }

  try {
    // Delete files from R2 storage
    console.log(`🗑️  Deleting files for rejected upload: ${id}`);
    const s3 = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Delete audio file
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: `${pendingUpload.audioHash}/index`,
        })
      );
      console.log(`✅ Audio file deleted: ${pendingUpload.audioHash}`);
    } catch (e) {
      console.error(`❌ Failed to delete audio file: ${pendingUpload.audioHash}`, e);
    }

    // Delete image file
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: env.R2_BUCKET,
          Key: `${pendingUpload.imageHash}/index`,
        })
      );
      console.log(`✅ Image file deleted: ${pendingUpload.imageHash}`);
    } catch (e) {
      console.error(`❌ Failed to delete image file: ${pendingUpload.imageHash}`, e);
    }

    // Update status to rejected (keep record for auditing)
    await algolia.updatePendingUploadStatus(id, 'rejected', user.id, {
      rejectionReason: reason,
    });

    console.log('✅ Pending upload rejected:', id);
    return true;
  } catch (error) {
    console.error('Failed to reject pending upload:', error);
    throw new GraphQLError('OPERATION_FAILED', {
      extensions: { code: 'OPERATION_FAILED', message: 'Failed to reject pending upload' },
    });
  }
};

