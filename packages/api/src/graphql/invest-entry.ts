import Mailer from '../postmark/mailer';
import { Context } from '../util/types';
import { requireAuth } from '../auth/auth-context';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';
import { AlgoliaClient } from 'src/algolia/algolia';

/**
 * Invest Entry Resolver - NEW CONTRACT INTERFACE
 * 
 * Flow:
 * 1. User invests XLM into an entry
 * 2. Contract records action as 'invest' kind
 * 3. XLM is added to entry's TVL (Total Value Locked)
 * 4. User receives HITZ rewards based on difficulty
 * 5. User's HITZ is auto-staked for future rewards
 * 6. Algolia index is updated with new TVL, APR, and stake
 */
export const investEntryResolver = async (_: any, args: any, context: Context) => {
	const { id, amount } = args;
	const { env } = context;
	const user = requireAuth(context);
	const encryption = new Encryption(env);
	const mailer = new Mailer(env);
	const algolia = new AlgoliaClient(env);
	const contract = new ContractClient(env);
	
	console.log('📊 Invest resolver - Entry:', id, 'Amount:', amount, 'stroops');

	try {
		// 1. Call the NEW unified record_action function
		// This replaces the old contract.invest() method
		const res = await contract.recordAction(
			await encryption.decrypt(user.seed),
			id,
			'invest',  // Action kind
			amount     // Amount in stroops (e.g., 1 XLM = 10_000_000 stroops)
		);
		
		console.log('✅ Record action result:', res?.status);

		// 2. Get updated entry data from contract
		// NEW: Entry interface has escrow_xlm and tvl_xlm fields
		const sorobanEntry = await contract.getEntry(id);
		
		// 3. Get entry statistics (NEW method)
		// Returns: { total_staked, reward_pool, apr }
		const stats = await contract.getEntryStats(id);
		
		// 4. Get user's stake in this entry (NEW method)
		// In the new contract, "shares" are now called "stakes"
		const userStake = await contract.getStake(id, user.publicKey);
		
		console.log('📈 Entry stats:', {
			tvl: sorobanEntry.tvl_xlm,
			escrow: sorobanEntry.escrow_xlm,
			apr: stats.apr,
			userStake
		});

		// 5. Update Algolia search index with new data
		try {
			await algolia.partialUpdateEntry({
				// Convert stroops to XLM for display (1 XLM = 10^7 stroops)
				tvl: Number(sorobanEntry.tvl_xlm) / 10_000_000,
				apr: Number(stats.apr) / 100, // APR is stored as basis points (e.g., 1250 = 12.50%)
				escrow: Number(sorobanEntry.escrow_xlm) / 10_000_000,
				totalStaked: Number(stats.totalStaked) / 10_000_000, // Total HITZ staked
				objectID: id,
			});

			// Update user's stake in this entry
			// This is used for displaying ownership percentage in the UI
			await algolia.updateShares(id, user.id, Number(userStake));
			
			console.log('✅ Algolia updated successfully');
		} catch (e) {
			console.error('❌ Algolia update failed:', e);
			// Don't fail the whole transaction if Algolia fails
		}

		// 6. Send email notification for large investments (> 0.3 XLM)
		try {
			if (amount > 3_000_000) {
				await mailer.sendNftInvestEmail(user.email);
			}
		} catch (e) {
			console.error('❌ Email notification failed:', e);
			// Don't fail the transaction if email fails
		}

		// 7. Return success response
		return {
			xdr: '',
			success: res?.status === 'SUCCESS',
			submitted: true,
			message: `Successfully invested ${amount / 10_000_000} XLM`,
		};
		
	} catch (error) {
		console.error('❌ Invest resolver error:', error);
		return {
			xdr: '',
			success: false,
			submitted: false,
			message: error instanceof Error ? error.message : 'Investment failed',
		};
	}
};
