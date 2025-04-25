import { GraphQLError } from 'graphql';
import { Context } from 'src/util/types';
import ContractClient from '../../contract';
import { AlgoliaClient } from 'src/algolia/algolia';
import { requireAuth } from 'src/auth/auth-context';
import Encryption from 'src/util/encryption';

// 24 hours in milliseconds
const COOLDOWN_PERIOD_MS = 24 * 60 * 60 * 1000;

export const claimEarningsResolver = async (_: any, __: any, context: Context) => {
	const algolia = new AlgoliaClient(context.env);
	const user = await requireAuth(context);
	const encryption = new Encryption(context.env);

	// Check if user has claimed earnings recently
	const claimCacheKey = `user_claim_${user.id}`;

	try {
		// Try to get the last claim timestamp from Algolia
		const lastClaimTimestamp = await algolia.getDistributionTimestamp(claimCacheKey);

		if (lastClaimTimestamp) {
			// Calculate elapsed time since last claim
			const currentTime = Date.now();
			const elapsedMs = currentTime - lastClaimTimestamp;

			// If less than 24 hours have passed since last claim
			if (elapsedMs < COOLDOWN_PERIOD_MS) {
				const hoursRemaining = Math.ceil((COOLDOWN_PERIOD_MS - elapsedMs) / (60 * 60 * 1000));
				const minutesRemaining = Math.ceil((COOLDOWN_PERIOD_MS - elapsedMs) / (60 * 1000)) % 60;

				return {
					success: false,
					totalClaimedAmount: 0,
					claimedEntries: [],
					message: `You can only claim earnings once every 24 hours. Please wait ${hoursRemaining} hours and ${minutesRemaining} minutes before claiming again.`,
					lastClaimTime: new Date(lastClaimTimestamp).toISOString(),
				};
			}
		}
	} catch (error) {
		console.error('Error checking claim timestamp:', error);
		// Continue with claiming if there's an issue with the timestamp
	}

	const contractClient = new ContractClient(context.env);

	const entries = await algolia.getCollection(user.id);
	let totalClaimedAmount = 0;
	const claimedEntries = [];

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		try {
			const result = await contractClient.claimEarnings(user.publicKey, entry.entryId, await encryption.decrypt(user.seed));

			// Add the claimed amount to our running total
			if (result && result.claimedAmount) {
				totalClaimedAmount += result.claimedAmount;

				// Only add entries with non-zero claimed amounts
				if (result.claimedAmount > 0) {
					claimedEntries.push({
						entryId: entry.entryId,
						amount: result.claimedAmount,
					});
				}
			}
		} catch (e) {
			console.error('Failed to claim earnings for entry:', entry.entryId, e);
		}
	}

	// Store the claim timestamp regardless of the claimed amount
	// This prevents users with no earnings from repeatedly hitting the contract
	try {
		// Store the current timestamp in Algolia
		await algolia.indices.distributionTimestampsIndex.saveObject({
			objectID: claimCacheKey,
			timestamp: Date.now(),
		});
	} catch (error) {
		console.error('Error storing claim timestamp:', error);
		// Continue even if storage fails
	}

	return {
		success: true,
		totalClaimedAmount: totalClaimedAmount / 10 ** 7, // Convert from stroops to lumens
		claimedEntries,
	};
};
