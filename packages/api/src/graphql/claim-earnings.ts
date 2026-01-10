import { Context } from 'src/util/types';
import ContractClient from '../../contract';
import StellarClient from '../stellar/operations';
import { AlgoliaClient } from 'src/algolia/algolia';
import { requireAuth } from 'src/auth/auth-context';
import Encryption from 'src/util/encryption';

// 24 hours in milliseconds
const COOLDOWN_PERIOD_MS = 24 * 60 * 60 * 1000;

/**
 * Claim Earnings Preview Resolver
 * 
 * Returns a preview of claimable rewards without actually claiming them.
 * Used by the frontend to show users what they could claim.
 */
export const claimEarningsPreviewResolver = async (_: any, __: any, context: Context) => {
	const algolia = new AlgoliaClient(context.env);
	const user = await requireAuth(context);
	const contractClient = new ContractClient(context.env);

	console.log('👀 Previewing claimable earnings for user:', user.publicKey);

	// Get all entries where user has invested/staked
	const entries = await algolia.getCollection(user.id);
	
	let totalClaimableAmount = 0;
	const claimableEntries = [];

	for (const entry of entries) {
		try {
			const claimableAmount = await contractClient.getClaimableRewards(
				entry.entryId,
				user.publicKey
			);

			if (claimableAmount > 0) {
				const amountInHitz = claimableAmount / 10_000_000;
				totalClaimableAmount += amountInHitz;
				claimableEntries.push({
					entryId: entry.entryId,
					amount: amountInHitz,
				});
			}
		} catch (e) {
			console.error(`Failed to check claimable for ${entry.entryId}:`, e);
		}
	}

	return {
		success: true,
		totalClaimedAmount: totalClaimableAmount,
		claimedEntries: claimableEntries,
		message: totalClaimableAmount > 0 
			? `You have ${totalClaimableAmount.toFixed(2)} HITZ available to claim`
			: 'No rewards available to claim',
		lastClaimTime: null,
	};
};

/**
 * Claim Earnings Resolver - NEW CONTRACT INTERFACE
 * 
 * How Rewards Work:
 * 1. Users stake HITZ tokens in entries (via invest/mine actions)
 * 2. Treasury bot distributes HITZ rewards to entry pools
 * 3. Users earn proportional to their stake percentage
 * 4. This function claims accumulated rewards from all staked entries
 * 
 * Example:
 * - Entry A has 1000 HITZ in reward pool
 * - You staked 100 HITZ (10% of total stakes)
 * - You can claim 100 HITZ (10% of reward pool)
 */
export const claimEarningsResolver = async (_: any, __: any, context: Context) => {
	const algolia = new AlgoliaClient(context.env);
	const user = await requireAuth(context);
	const encryption = new Encryption(context.env);
	const contractClient = new ContractClient(context.env);
    const stellar = new StellarClient(context.env);

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
		console.error('❌ Error checking claim timestamp:', error);
		// Continue with claiming if there's an issue with the timestamp
	}

	console.log('💰 Starting claim process for user:', user.publicKey);

	// Get all entries where user has invested/staked
	// NOTE: You might need to update Algolia to track which entries users have stakes in
	// For now, we'll use the user's collection as a proxy
	const entries = await algolia.getCollection(user.id);
	
	let totalClaimedAmount = 0; // In stroops (1 HITZ = 10^7 stroops)
	const claimedEntries = [];
	const userSecret = await encryption.decrypt(user.seed);

	// Ensure trustline for HITZ (classic asset) exists if configured
	try {
		await stellar.ensureHitzTrustline(userSecret);
	} catch (e) {
		console.log('ensureHitzTrustline skipped/failed:', (e as any)?.message || e);
	}

	console.log(`📊 Checking ${entries.length} entries for claimable rewards`);

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		
		try {
			// STEP 1: Check if there are any claimable rewards (saves gas if nothing to claim)
			const claimableAmount = await contractClient.getClaimableRewards(
				entry.entryId,
				user.publicKey
			);

			if (claimableAmount > 0) {
				console.log(`💎 Entry ${entry.entryId} has ${claimableAmount / 10_000_000} HITZ to claim`);
				
				// STEP 2: Claim the rewards using the NEW claimRewards method
				const result = await contractClient.claimRewards(
					userSecret,
					entry.entryId
				);

				// STEP 3: Track the claimed amount
				if (result && result.claimedAmount) {
					totalClaimedAmount += result.claimedAmount;

					claimedEntries.push({
						entryId: entry.entryId,
						amount: result.claimedAmount / 10_000_000, // Convert to HITZ (from stroops)
					});
					
					console.log(`✅ Claimed ${result.claimedAmount / 10_000_000} HITZ from ${entry.entryId}`);
				}
			} else {
				console.log(`⏭️  Entry ${entry.entryId} has no rewards to claim`);
			}
		} catch (e) {
			console.error(`❌ Failed to claim from entry ${entry.entryId}:`, e);
			// Continue with other entries even if one fails
		}
	}

	// Store the claim timestamp regardless of the claimed amount
	// This prevents users with no earnings from repeatedly hitting the contract
	try {
		await algolia.indices.distributionTimestampsIndex.saveObject({
			objectID: claimCacheKey,
			timestamp: Date.now(),
		});
		console.log('✅ Claim timestamp stored');
	} catch (error) {
		console.error('❌ Error storing claim timestamp:', error);
		// Continue even if storage fails
	}

	const totalInHitz = totalClaimedAmount / 10_000_000;
	
	console.log(`🎉 Total claimed: ${totalInHitz} HITZ from ${claimedEntries.length} entries`);

	return {
		success: true,
		totalClaimedAmount: totalInHitz,
		claimedEntries,
		message: totalInHitz > 0 
			? `Successfully claimed ${totalInHitz.toFixed(2)} HITZ` 
			: 'No rewards available to claim at this time',
		lastClaimTime: new Date().toISOString(),
	};
};
