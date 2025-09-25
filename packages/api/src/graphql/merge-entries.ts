import { AlgoliaClient } from 'src/algolia/algolia';
import { requireAuth } from 'src/auth/auth-context';
import { Context } from 'src/util/types';
import ContractClient from '../../contract';

const adminId = '-NpzLBvz8ypxJwnK3JVL';

export const mergeEntriesResolver = async (_: any, { fromId, toId }: any, ctx: Context) => {
	const user = requireAuth(ctx);
	if (user.id !== adminId) return false;

	const algolia = new AlgoliaClient(ctx.env);
	const contract = new ContractClient(ctx.env);

	try {
		await contract.mergeEntries(fromId, toId);
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
			await algolia.partialUpdateEntry({
				objectID: toId,
				tvl: onchainTo.tvl,
				apr: onchainTo.apr,
				escrow: onchainTo.escrow,
			});
			// Update per-user shares objects for destination based on on-chain map
			const updates: Array<{ entryId: string; userId: string; shares: number }> = [];
			try {
				const sharesArray = (onchainTo.shares as any) as Array<[string, number]>;
				for (const [publicKey, shares] of sharesArray as any) {
					try {
						const holder = await algolia.getUserByPublicKey(publicKey);
						updates.push({ entryId: toId, userId: holder.id, shares: Number(shares) });
					} catch (_) {}
				}
			} catch (e) {
				console.log('merge-entries: shares sync skipped', e);
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
