import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';
import { Context } from 'src/util/types';
import { ADMIN_ID } from 'src/constants/constants';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';

/**
 * Mutation resolver to merge a pending mine to an existing track
 * This adds the user's stake to the target entry instead of creating a new one
 */
export const mergePendingMineResolver = async (
  _: any,
  { id, targetEntryId }: { id: string; targetEntryId: string },
  ctx: Context
): Promise<{ success: boolean; message: string; mergedToEntryId?: string }> => {
  const user = requireAuth(ctx);
  const env = ctx.env;

  // Only admin can merge pending mines
  if (user.id !== ADMIN_ID) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only admins can merge pending mines' },
    });
  }

  const algolia = new AlgoliaClient(env);
  const contract = new ContractClient(env);
  const encryption = new Encryption(env);

  // Get the pending mine
  let pendingMine;
  try {
    pendingMine = await algolia.getPendingMine(id);
  } catch (error) {
    throw new GraphQLError('NOT_FOUND', {
      extensions: { code: 'NOT_FOUND', message: 'Pending mine not found' },
    });
  }

  if (pendingMine.status !== 'pending') {
    throw new GraphQLError('INVALID_STATUS', {
      extensions: {
        code: 'INVALID_STATUS',
        message: `Pending mine has already been ${pendingMine.status}`,
      },
    });
  }

  // Verify target entry exists
  let targetEntry;
  try {
    targetEntry = await algolia.getEntry(targetEntryId);
  } catch (error) {
    throw new GraphQLError('TARGET_NOT_FOUND', {
      extensions: { code: 'TARGET_NOT_FOUND', message: 'Target entry not found' },
    });
  }

  // Get the original user who tried to mine
  let originalUser;
  try {
    originalUser = await algolia.getUser(pendingMine.userId);
  } catch (error) {
    throw new GraphQLError('USER_NOT_FOUND', {
      extensions: { code: 'USER_NOT_FOUND', message: 'Original user not found' },
    });
  }

  try {
    const userSeed = await encryption.decrypt(originalUser.seed);

    console.log('🔀 Merging pending mine to existing entry:', {
      pendingMineId: id,
      targetEntryId,
      user: originalUser.publicKey,
    });

    // Mine the target entry (contract handles all fees and stakes)
    console.log('⛏️  Mining target entry:', targetEntryId);
    await contract.recordAction(userSeed, targetEntryId, 'mine');

    // Update Algolia with new on-chain data for target entry
    try {
      console.log('📈 Updating Algolia with on-chain data...');

      const chainEntry = await contract.getEntry(targetEntryId);
      const stats = await contract.getEntryStats(targetEntryId);
      const userStake = await contract.getStake(targetEntryId, originalUser.publicKey);

      // Update or create user's stake record for target entry
      await algolia.updateShares(targetEntryId, originalUser.id, Number(userStake));

      // Update target entry metrics
      await algolia.partialUpdateEntry({
        objectID: targetEntryId,
        tvl: Number(chainEntry.tvl_xlm) / 10_000_000,
        escrow: Number(chainEntry.escrow_xlm) / 10_000_000,
        apr: Number(stats.apr) / 100,
        totalStaked: Number(stats.totalStaked) / 10_000_000,
      });

      console.log('✅ Algolia updated for target entry');
    } catch (e) {
      console.error('❌ Post-merge update failed:', e);
      // Don't fail the whole operation
    }

    // Delete pending mine from Algolia (no longer needed)
    await algolia.deletePendingMine(id);

    console.log('✅ Pending mine merged to existing entry:', targetEntryId);

    return {
      success: true,
      message: 'Pending mine merged to existing entry successfully',
      mergedToEntryId: targetEntryId,
    };
  } catch (error: any) {
    console.error('❌ Failed to merge pending mine:', error);

    // Check if it's a known error type
    const errorMsg = error?.message || 'Failed to merge pending mine';
    
    throw new GraphQLError('MERGE_FAILED', {
      extensions: {
        code: 'MERGE_FAILED',
        message: errorMsg,
      },
    });
  }
};

