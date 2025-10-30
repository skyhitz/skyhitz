import { GraphQLError } from 'graphql';
import { requireAuth } from '../auth/auth-context';
import { AlgoliaClient } from '../algolia/algolia';
import { Context } from '../util/types';
import StorageClient from '../util/storage-client';
import StellarClient from '../stellar/operations';
import ContractClient from '../../contract';
import Encryption from '../util/encryption';
import crypto from 'crypto';

export interface UploadMintInput {
  audioHash: string; // IPFS hash from pre-upload
  imageHash: string; // IPFS hash from pre-upload
  title: string;
  artist: string;
  description?: string;
  qualityScore: number; // 0-10 from analysis
  mintCost: number; // In XLM from analysis
}

export interface UploadMintResponse {
  success: boolean;
  message: string;
  entryId?: string;
  txHash?: string;
}

/**
 * Mint an uploaded track as an NFT entry
 * 
 * Flow:
 * 1. Validate user has sufficient balance (mint cost + fees)
 * 2. Create entry ID and metadata
 * 3. Index entry in Algolia
 * 4. Create entry in contract
 * 5. Record mine action with dynamic cost
 * 6. Update Algolia with on-chain data
 */
export const uploadMintResolver = async (
  _: any,
  { input }: { input: UploadMintInput },
  ctx: Context
): Promise<UploadMintResponse> => {
  const user = requireAuth(ctx);
  const env = ctx.env;
  const algolia = new AlgoliaClient(env);
  const stellar = new StellarClient(env);
  const contract = new ContractClient(env);
  const encryption = new Encryption(env);

  const { audioHash, imageHash, title, artist, description, qualityScore, mintCost } = input;

  // Validate inputs
  if (!audioHash || !imageHash || !title || !artist) {
    throw new GraphQLError('Missing required fields');
  }

  if (qualityScore < 0 || qualityScore > 10) {
    throw new GraphQLError('Invalid quality score');
  }

  if (mintCost < 0.1 || mintCost > 10) {
    throw new GraphQLError('Invalid mint cost');
  }

  // 1) Balance check: require mint cost + buffer for fees
  const { availableCredits } = await stellar.accountCredits(user.publicKey);
  const requiredBalance = mintCost + 0.2; // mint cost + buffer for Stellar fees
  
  if (availableCredits < requiredBalance) {
    throw new GraphQLError('INSUFFICIENT_FUNDS', {
      extensions: {
        code: 'INSUFFICIENT_FUNDS',
        required: requiredBalance,
        available: availableCredits,
      },
    });
  }

  try {
    // 2) Generate entry ID
    const entryId = `upload-${crypto.randomUUID()}`;
    console.log(`🎵 Creating new uploaded entry: ${entryId}`);
    console.log(`   Title: ${title}`);
    console.log(`   Artist: ${artist}`);
    console.log(`   Quality Score: ${qualityScore}/10`);
    console.log(`   Mint Cost: ${mintCost} XLM`);

    // 3) Prepare entry metadata for Algolia
    const videoUrl = `ipfs://${audioHash}`;
    const imageUrl = `ipfs://${imageHash}`;
    
    const entryData = {
      objectID: entryId,
      id: entryId,
      title,
      artist,
      description: description || '',
      videoUrl,
      imageUrl,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Date.now(),
      userId: user.id,
      userName: user.displayName || user.username,
      userAvatar: user.avatarUrl || '',
      source: 'upload',
      qualityScore, // Store quality score for reference
      mintCost, // Store original mint cost
      tvl: 0,
      escrow: 0,
      apr: 0,
      totalStaked: 0,
      likeCount: 0,
    };

    // 4) Index entry in Algolia
    console.log('📊 Indexing entry in Algolia...');
    await algolia.saveEntry(entryData);
    console.log('✅ Entry indexed in Algolia');

    // 5) Get user's decrypted seed for contract interaction
    const userSeed = await encryption.decrypt(user.seed);

    // 6) Create entry in contract
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

    // 7) Record mine action with dynamic cost
    // Convert XLM to stroops (1 XLM = 10,000,000 stroops)
    const mintCostStroops = Math.round(mintCost * 10_000_000);
    
    console.log(`⛏️  Recording mine action with ${mintCost} XLM (${mintCostStroops} stroops)...`);
    try {
      // Use invest action with custom amount for dynamic pricing
      await contract.recordAction(
        userSeed,
        entryId,
        'invest', // Use invest for custom XLM amount
        mintCostStroops
      );
      console.log('✅ Mine action recorded');
    } catch (error: any) {
      console.error('❌ Mine action failed:', error);
      // Entry exists in contract and Algolia but not mined
      // Could implement cleanup or leave for manual intervention
      throw new GraphQLError('Failed to record mine action. Entry created but not mined.');
    }

    // 8) Update Algolia with on-chain data
    console.log('📈 Updating Algolia with on-chain data...');
    try {
      const chainEntry = await contract.getEntry(entryId);
      const stats = await contract.getEntryStats(entryId);
      const userStake = await contract.getStake(entryId, user.publicKey);

      // Update user's stake for this entry
      await algolia.updateShares(entryId, user.id, Number(userStake));

      // Update entry metrics
      await algolia.partialUpdateEntry({
        objectID: entryId,
        tvl: Number(chainEntry.tvl_xlm) / 10_000_000,
        escrow: Number(chainEntry.escrow_xlm) / 10_000_000,
        apr: Number(stats.apr) / 100,
        totalStaked: Number(stats.totalStaked) / 10_000_000,
      });

      console.log('✅ Algolia updated with on-chain data:', {
        tvl: (Number(chainEntry.tvl_xlm) / 10_000_000).toFixed(2),
        escrow: (Number(chainEntry.escrow_xlm) / 10_000_000).toFixed(2),
        apr: (Number(stats.apr) / 100).toFixed(2) + '%',
        totalStaked: (Number(stats.totalStaked) / 10_000_000).toFixed(2) + ' HITZ',
      });
    } catch (error) {
      console.error('❌ Post-mint update failed:', error);
      // Don't fail the whole operation if Algolia update fails
      // The entry is successfully minted, just metrics might be outdated
    }

    console.log('🎉 Successfully minted uploaded track!');
    
    return {
      success: true,
      message: 'Track minted successfully!',
      entryId,
    };
  } catch (error: any) {
    console.error('❌ Upload mint error:', error);
    
    // Return appropriate error message
    if (error instanceof GraphQLError) {
      throw error;
    }
    
    throw new GraphQLError(error.message || 'Failed to mint track');
  }
};

