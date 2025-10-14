import { AlgoliaClient } from '../algolia/algolia';
import ContractClient from '../../contract';

/**
 * Sync all entry APRs from contract to Algolia
 * This should be called after reward distribution to update APRs
 * 
 * @param env - Environment variables
 * @returns Object with success status and stats
 */
export async function syncAllAPRsToAlgolia(env: Env): Promise<{
	success: boolean;
	entriesSynced: number;
	errors: string[];
}> {
	const errors: string[] = [];
	let entriesSynced = 0;

	try {
		const contract = new ContractClient(env);
		const algolia = new AlgoliaClient(env);

		// Get all entry IDs from contract
		console.log('Fetching all entry IDs from contract...');
		const entryIds = await contract.getAllEntryIds();
		console.log(`Found ${entryIds.length} entries to sync`);

		if (entryIds.length === 0) {
			return { success: true, entriesSynced: 0, errors: [] };
		}

		// Batch update entries in chunks to avoid overwhelming Algolia
		const BATCH_SIZE = 50;
		const updates: Array<{ objectID: string; tvl: number; escrow: number; apr: number }> = [];

		for (let i = 0; i < entryIds.length; i++) {
			const entryId = entryIds[i];

			try {
				// Get entry stats from contract
				const stats = await contract.getEntryStats(entryId);

				// Convert from stroops to XLM and basis points to percentage
				const update = {
					objectID: entryId,
					tvl: stats.tvlXlm / 10_000_000,
					escrow: stats.escrowXlm / 10_000_000,
					apr: stats.apr / 100, // basis points to percentage
				};

				updates.push(update);
				entriesSynced++;

				// Batch update every BATCH_SIZE entries or at the end
				if (updates.length >= BATCH_SIZE || i === entryIds.length - 1) {
					console.log(`Syncing batch of ${updates.length} entries to Algolia...`);
					await Promise.all(
						updates.map((u) =>
							algolia.partialUpdateEntry(u).catch((err) => {
								const errMsg = `Failed to update ${u.objectID}: ${err.message || err}`;
								console.error(errMsg);
								errors.push(errMsg);
							})
						)
					);
					updates.length = 0; // Clear array
				}
			} catch (err: any) {
				const errMsg = `Failed to sync entry ${entryId}: ${err.message || err}`;
				console.error(errMsg);
				errors.push(errMsg);
			}
		}

		console.log(`APR sync complete: ${entriesSynced} entries synced, ${errors.length} errors`);
		return {
			success: errors.length < entryIds.length / 2, // Success if < 50% failed
			entriesSynced,
			errors,
		};
	} catch (error: any) {
		const errMsg = `Fatal error syncing APRs: ${error.message || error}`;
		console.error(errMsg);
		return {
			success: false,
			entriesSynced,
			errors: [errMsg, ...errors],
		};
	}
}

