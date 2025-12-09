import { Context } from '../util/types';
import { requireAuth } from '../auth/auth-context';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';
import { AlgoliaClient } from 'src/algolia/algolia';

/**
 * Unstake Entry Resolver - NEW FEATURE
 * 
 * Flow:
 * 1. User wants to withdraw their staked HITZ from an entry
 * 2. Contract validates user has sufficient stake
 * 3. Updates stake maps (user stake, total stake)
 * 4. Transfers HITZ tokens back to user's wallet
 * 5. Algolia index is updated with new stake amounts
 * 
 * Important:
 * - User loses their ownership percentage in the entry
 * - User loses future rewards from this entry
 * - User can then transfer HITZ out or re-stake elsewhere
 * - This provides liquidity and user control
 */
export const unstakeEntryResolver = async (_: any, args: any, context: Context) => {
	const { id, amount } = args;
	const { env } = context;
	const user = requireAuth(context);
	const encryption = new Encryption(env);
	const algolia = new AlgoliaClient(env);
	const contract = new ContractClient(env);
	
	console.log('🔓 Unstake resolver - Entry:', id, 'Amount:', amount, 'stroops');

	try {
		// 1. Call the unstake function
		const userSecret = await encryption.decrypt(user.seed);
		const res = await contract.unstake(userSecret, id, amount);
		
		console.log('✅ Unstake result:', res?.sendTransactionResponse?.status, 'Amount:', res.unstakedAmount);

		// 2. Get updated entry data from contract
		const sorobanEntry = await contract.getEntry(id);
		
		// 3. Get entry statistics (updated after unstake)
		const stats = await contract.getEntryStats(id);
		
		// 4. Get user's remaining stake in this entry
		const userStake = await contract.getStake(id, user.publicKey);
		
		console.log('📈 Updated stats:', {
			tvl: sorobanEntry.tvl,
			userStake,
			totalStaked: stats.totalStaked,
		});

		// 5. Update Algolia search index with new data
		try {
			await algolia.partialUpdateEntry({
				// TVL doesn't change (only stakes change, not XLM)
				tvl: Number(sorobanEntry.tvl) / 10_000_000,
				apr: Number(stats.apr) / 100,
				escrow: Number(sorobanEntry.escrow) / 10_000_000,
				totalStaked: Number(stats.totalStaked) / 10_000_000, // Total HITZ staked
				objectID: id,
			});

			// Update user's stake in this entry
			await algolia.updateShares(id, user.id, Number(userStake));
			
			console.log('✅ Algolia updated successfully');
		} catch (e) {
			console.error('❌ Algolia update failed:', e);
			// Don't fail the whole transaction if Algolia fails
		}

		// 6. Return success response
		return {
			success: !!(res && res.unstakedAmount),
			message: `Successfully unstaked ${amount / 10_000_000} HITZ`,
			unstakedAmount: res.unstakedAmount / 10_000_000, // Convert to HITZ
		};
		
	} catch (error) {
		console.error('❌ Unstake resolver error:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Unstaking failed',
			unstakedAmount: 0,
		};
	}
};

