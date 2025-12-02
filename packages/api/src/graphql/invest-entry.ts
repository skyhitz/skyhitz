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
 * 1. Verify entry exists in Algolia + check contract (parallel, for speed)
 * 2. Create entry in contract if needed (auto-provision)
 * 3. User invests HITZ into an entry
 * 4. Contract records action as 'invest' kind
 * 5. HITZ is added to entry's TVL (Total Value Locked)
 * 6. User receives HITZ rewards based on difficulty
 * 7. User's HITZ is auto-staked for future rewards
 * 8. Algolia index is updated with new TVL, APR, and stake
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
		// 1. Check Algolia (hard requirement - will throw if not found)
		// 2. Check contract in parallel (may or may not exist)
		console.log('🔍 Checking entry existence in Algolia and contract...');
		const [algoliaEntry, contractEntry] = await Promise.all([
			algolia.getEntry(id),
			contract.getEntry(id).catch(() => null) // Contract entry is optional, return null if not found
		]);

		// Validate Algolia entry exists and ID matches
		if (!algoliaEntry || algoliaEntry.objectID !== id) {
			console.error('❌ Entry not found or ID mismatch in Algolia:', id);
			throw new Error('Entry does not exist. Please ensure the entry is properly indexed before investing.');
		}
		console.log('✅ Entry found in Algolia');

		// Check if entry exists in contract
		const entryExists = contractEntry !== null;
		console.log(entryExists ? '✅ Entry exists in contract' : '❌ Entry not found in contract, will create it');

		// 3. Create entry in contract if it doesn't exist (admin operation)
		if (!entryExists) {
			console.log('📝 Creating entry in contract before investing...');
			try {
				await contract.createEntry(id);
				console.log('✅ Entry created in contract');
			} catch (createError: any) {
				console.error('❌ Failed to create entry:', createError);
				throw new Error(`Failed to create entry in contract: ${createError.message || createError}`);
			}
		}

		// 4. Call the NEW unified record_action function
		// This replaces the old contract.invest() method
		const res = await contract.recordAction(
			await encryption.decrypt(user.seed),
			id,
			'invest',  // Action kind
			amount     // Amount in stroops (e.g., 1 XLM = 10_000_000 stroops)
		);
		
		console.log('✅ Record action result:', res?.status);

		// 5. Get updated entry data from contract
		// NEW: Entry interface has escrow_hitz and tvl_hitz fields
		const sorobanEntry = await contract.getEntry(id);
		
		// 6. Get entry statistics (NEW method)
		// Returns: { total_staked, reward_pool, apr }
		const stats = await contract.getEntryStats(id);
		
		// 7. Get user's stake in this entry (NEW method)
		// In the new contract, "shares" are now called "stakes"
		const userStake = await contract.getStake(id, user.publicKey);
		
		console.log('📈 Entry stats:', {
			tvl: sorobanEntry.tvl_hitz,
			escrow: sorobanEntry.escrow_hitz,
			apr: stats.apr,
			userStake
		});

		// 8. Update Algolia search index with new data
		try {
			await algolia.partialUpdateEntry({
				// Convert stroops to HITZ for display (1 HITZ = 10^7 stroops)
				tvl: Number(sorobanEntry.tvl_hitz) / 10_000_000,
				apr: Number(stats.apr) / 100, // APR is stored as basis points (e.g., 1250 = 12.50%)
				escrow: Number(sorobanEntry.escrow_hitz) / 10_000_000,
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

		// 9. Send email notification for large investments (> 3 HITZ)
		try {
			if (amount > 30_000_000) {
				await mailer.sendNftInvestEmail(user.email);
			}
		} catch (e) {
			console.error('❌ Email notification failed:', e);
			// Don't fail the transaction if email fails
		}

		// 10. Return success response
		return {
			xdr: '',
			success: res?.status === 'SUCCESS',
			submitted: true,
			message: `Successfully invested ${amount / 10_000_000} HITZ`,
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
