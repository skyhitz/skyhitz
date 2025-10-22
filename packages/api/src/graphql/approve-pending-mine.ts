import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';
import { Context, Entry } from 'src/util/types';
import { ADMIN_ID } from 'src/constants/constants';
import StorageClient from '../util/storage-client';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';

/**
 * Mutation resolver to approve a pending mine and create the entry
 * This performs the actual mining operation that was deferred
 */
export const approvePendingMineResolver = async (
  _: any,
  { id }: { id: string },
  ctx: Context
): Promise<{ success: boolean; message: string; entry?: Entry }> => {
  const user = requireAuth(ctx);
  const env = ctx.env;

  // Only admin can approve pending mines
  if (user.id !== ADMIN_ID) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only admins can approve pending mines' },
    });
  }

  const algolia = new AlgoliaClient(env);
  const storage = new StorageClient(env);
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

  // Get the original user who tried to mine
  let originalUser;
  try {
    originalUser = await algolia.getUser(pendingMine.userId);
  } catch (error) {
    throw new GraphQLError('USER_NOT_FOUND', {
      extensions: { code: 'USER_NOT_FOUND', message: 'Original user not found' },
    });
  }

  const track = pendingMine.track;

  try {
    // Resolve external audio URL
    const { externalAudioUrlResolver } = await import('./search-external-music');
    const audioUrl = await externalAudioUrlResolver({}, { id: track.id }, { env } as any);
    if (!audioUrl) throw new Error('Could not resolve external audio url');

    // Pin media to R2
    const pinnedAudio = await storage.pinAssetUrl(audioUrl);
    if (!pinnedAudio?.IpfsHash) throw new Error('Failed to pin audio');

    let pinnedImageHash: string | null = null;
    if (track.imageUrl) {
      const imageUrlMax =
        track.source === 'audius'
          ? track.imageUrl.replace(/\/(150x150|480x480)\.(jpg|jpeg|png|webp)$/i, '/1000x1000.$2')
          : track.imageUrl;
      const pinnedImage = await storage.pinAssetUrl(imageUrlMax);
      pinnedImageHash = pinnedImage?.IpfsHash || null;
    }

    // Build metadata JSON and pin it
    const metadata = {
      description: `${track.artist || ''} - ${track.title}`.trim(),
      external_url: track.url || '',
      image: pinnedImageHash ? `ipfs://${pinnedImageHash}` : '',
      name: `${track.artist || ''} - ${track.title}`.trim(),
      image_hash: pinnedImageHash || '',
      animation_url: `ipfs://${pinnedAudio.IpfsHash}`,
      networks: {},
      source: track.source,
      sourceId: track.id,
    } as any;

    const metaCid = await storage.pinJSON(metadata);

    // Perform on-chain operations
    const userSeed = await encryption.decrypt(originalUser.seed);

    // STEP 1: Create entry in contract
    console.log('⛏️  Creating entry in contract:', metaCid);
    await contract.createEntry(metaCid);

    // STEP 2: Mine the entry (contract handles all fees and stakes)
    console.log('⛏️  Mining entry:', metaCid);
    await contract.recordAction(userSeed, metaCid, 'mine');

    // Create entry in Algolia
    const entry: Entry = {
      description: metadata.description,
      imageUrl: metadata.image,
      videoUrl: metadata.animation_url,
      title: track.title,
      id: metaCid,
      objectID: metaCid,
      artist: track.artist || '',
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(Date.now() / 1000),
      source: track.source,
      sourceId: track.id,
    } as any;

    await algolia.saveEntry(entry);

    // Update Algolia with on-chain data
    try {
      console.log('📈 Updating Algolia with on-chain data...');

      const chainEntry = await contract.getEntry(metaCid);
      const stats = await contract.getEntryStats(metaCid);
      const userStake = await contract.getStake(metaCid, originalUser.publicKey);

      await algolia.updateShares(metaCid, originalUser.id, Number(userStake));

      await algolia.partialUpdateEntry({
        objectID: metaCid,
        tvl: Number(chainEntry.tvl_xlm) / 10_000_000,
        escrow: Number(chainEntry.escrow_xlm) / 10_000_000,
        apr: Number(stats.apr) / 100,
        totalStaked: Number(stats.totalStaked) / 10_000_000,
      });

      console.log('✅ Algolia updated');
    } catch (e) {
      console.error('❌ Post-index update failed:', e);
    }

    // Update pending mine status
    await algolia.updatePendingMineStatus(id, 'approved', user.id);

    console.log('✅ Pending mine approved and entry created:', metaCid);

    return {
      success: true,
      message: 'Pending mine approved and entry created successfully',
      entry,
    };
  } catch (error: any) {
    console.error('❌ Failed to approve pending mine:', error);
    
    // Don't update status to failed, keep as pending so admin can retry
    throw new GraphQLError('APPROVAL_FAILED', {
      extensions: {
        code: 'APPROVAL_FAILED',
        message: error?.message || 'Failed to approve pending mine',
      },
    });
  }
};

