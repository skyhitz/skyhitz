import { AlgoliaClient } from 'src/algolia/algolia';
import { requireAuth } from 'src/auth/auth-context';
import { Context } from 'src/util/types';
import ContractClient from '../../contract';
import { ADMIN_ID } from 'src/constants/constants';

export const mergeEntriesResolver = async (_: any, { fromId, toId }: any, ctx: Context) => {
	const user = requireAuth(ctx);
	if (user.id !== ADMIN_ID) return false;

	const algolia = new AlgoliaClient(ctx.env);
	const contract = new ContractClient(ctx.env);

	// Get list of stakers (public keys) from Algolia for migration
	let stakers: string[] = [];
	try {
		const shares = await algolia.getSharesByEntry(fromId);
		for (const share of shares) {
			const user = await algolia.getUser(share.userId);
			if (user?.publicKey) {
				stakers.push(user.publicKey);
			}
		}
	} catch (e) {
		console.log('merge-entries: failed to fetch stakers', e);
	}

	try {
		await contract.mergeEntries(fromId, toId, stakers);
	} catch (e) {
		console.log('merge-entries: contract merge failed', e);
		return false;
	}

	// Update Algolia: move counters/fields and shares
	try {
		const [fromEntry, toEntry] = await Promise.all([
			algolia.getEntry(fromId).catch(() => null as any),
			algolia.getEntry(toId).catch(() => null as any),
		]);

		// Update destination entry numeric fields from chain
		try {
			const onchainTo = await contract.getEntry(toId);
			const stats = await contract.getEntryStats(toId);
			
			// Convert stroops to XLM for Algolia
			await algolia.partialUpdateEntry({
				objectID: toId,
				tvl: Number(onchainTo.tvl_xlm) / 10_000_000,
				apr: Number(stats.apr) / 100,
				escrow: Number(onchainTo.escrow_xlm) / 10_000_000,
				totalStaked: Number(stats.totalStaked) / 10_000_000, // Total HITZ staked
			});
			
			// Update per-user stakes (formerly "shares") based on on-chain data
			const updates: Array<{ entryId: string; userId: string; shares: number }> = [];
			
			// Get all shares from Algolia for this entry
			try {
				const existingShares = await algolia.getSharesByEntry(toId);
				
				// Update each user's stake from the contract
				for (const share of existingShares) {
					try {
						const user = await algolia.getUser(share.userId);
						if (user && user.publicKey) {
							const userStake = await contract.getStake(toId, user.publicKey);
							updates.push({ 
								entryId: toId, 
								userId: user.id, 
								shares: Number(userStake) 
							});
						}
					} catch (e) {
						console.log('merge-entries: failed to update stake for user', share.userId, e);
					}
				}
			} catch (e) {
				console.log('merge-entries: stakes sync skipped', e);
			}
			
			await algolia.bulkUpdateShares(updates);
		} catch (e) {
			console.log('merge-entries: update destination failed', e);
		}

		// Remove source entry and its shares from Algolia
		try {
			await algolia.deleteSharesByEntry(fromId);
			await algolia.deleteEntry(fromId);
		} catch (e) {
			console.log('merge-entries: delete source failed', e);
		}
	} catch (e) {
		console.log('merge-entries: algolia handling failed', e);
	}

	return true;
};
