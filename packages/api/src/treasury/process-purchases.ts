import { AlgoliaClient } from 'src/algolia/algolia';
import StellarClient from 'src/stellar/operations';
import KrakenClient from 'src/kraken/client';
import Mailer from 'src/postmark/mailer';
import ContractClient from '../../contract';
import SoroswapClient from 'src/soroswap/client';
import { createUserWithEmailResolver } from 'src/graphql/create-user-with-email';
import { Context } from 'src/util/types';

export interface ProcessPurchasesResult {
	processed: number;
	pending: number;
	failed: number;
	errors: string[];
}

/**
 * Process pending HITZ purchases
 * 
 * This function is called by the cron job every minute to:
 * 1. Check for pending Kraken withdrawals
 * 2. When withdrawal is complete (XLM arrived), execute the swap
 * 3. Send HITZ to the user
 */
export async function processPendingPurchases(env: Env): Promise<ProcessPurchasesResult> {
	const result: ProcessPurchasesResult = {
		processed: 0,
		pending: 0,
		failed: 0,
		errors: [],
	};

	const algolia = new AlgoliaClient(env);
	const krakenClient = new KrakenClient(env);

	try {
		// Get all pending withdrawals from Algolia
		const pendingWithdrawals = await algolia.getPendingWithdrawals();

		if (pendingWithdrawals.length === 0) {
			console.log('📭 No pending purchases to process');
			return result;
		}

		console.log(`📦 Found ${pendingWithdrawals.length} pending purchase(s) to check`);

		// Get withdrawal statuses from Kraken
		const statusData = await krakenClient.withdrawStatus();

		if (statusData.error?.length > 0) {
			const errorMsg = `Kraken API error: ${statusData.error.join(', ')}`;
			console.error(`❌ ${errorMsg}`);
			result.errors.push(errorMsg);
			return result;
		}

		// Process each pending withdrawal
		for (const withdrawal of pendingWithdrawals) {
			try {
				const krakenStatus = statusData.result.find((w) => w.refid === withdrawal.objectID);

				if (!krakenStatus) {
					// Withdrawal not found in Kraken - might be too old or not yet visible
					console.log(`⏳ Withdrawal ${withdrawal.objectID} not found in Kraken status yet`);
					result.pending++;
					continue;
				}

				console.log(`🔍 Withdrawal ${withdrawal.objectID}: Kraken status = ${krakenStatus.status}`);

				if (krakenStatus.status === 'Success') {
					// XLM has arrived! Execute the swap and send HITZ
					console.log(`✅ Withdrawal ${withdrawal.objectID} complete! Processing swap...`);
					
					await executeSwapAndSendHITZ(withdrawal.objectID, withdrawal.amount, withdrawal.email, env);
					
					// Delete the withdrawal record (it's complete)
					await algolia.deleteWithdrawal(withdrawal.objectID);
					
					result.processed++;
					console.log(`🎉 Successfully processed purchase for ${withdrawal.email}`);
					
				} else if (krakenStatus.status === 'Failed' || krakenStatus.status === 'Cancelled') {
					// Withdrawal failed - notify support
					const errorMsg = `Withdrawal ${withdrawal.objectID} failed with status: ${krakenStatus.status}`;
					console.error(`❌ ${errorMsg}`);
					
					// Update status to failed
					await algolia.updateWithdrawalStatus(withdrawal.objectID, 'failed');
					
					// Send support email
					const mailer = new Mailer(env);
					await mailer.sendSupportEmail(
						withdrawal.email,
						new Error(errorMsg),
						withdrawal.amount
					);
					
					result.failed++;
					result.errors.push(errorMsg);
					
				} else {
					// Still pending (status could be 'Pending', 'Initial', etc.)
					console.log(`⏳ Withdrawal ${withdrawal.objectID} still ${krakenStatus.status}`);
					result.pending++;
				}
				
			} catch (error: any) {
				const errorMsg = `Error processing withdrawal ${withdrawal.objectID}: ${error.message}`;
				console.error(`❌ ${errorMsg}`);
				result.errors.push(errorMsg);
				result.failed++;
			}
		}

		return result;

	} catch (error: any) {
		const errorMsg = `Error in processPendingPurchases: ${error.message}`;
		console.error(`❌ ${errorMsg}`);
		result.errors.push(errorMsg);
		return result;
	}
}

/**
 * Execute XLM → HITZ swap via Soroswap and send HITZ to user
 */
async function executeSwapAndSendHITZ(
	refid: string,
	xlmAmount: number,
	email: string,
	env: Env
): Promise<void> {
	const soroswap = new SoroswapClient(env);
	const algolia = new AlgoliaClient(env);
	const stellar = new StellarClient(env);
	const contract = new ContractClient(env);

	// Keep 2 XLM for network fees, swap the rest
	const xlmToSwap = Math.max(0, xlmAmount - 2);

	if (xlmToSwap <= 0) {
		throw new Error(`Insufficient XLM amount for swap: ${xlmAmount} XLM (need > 2 XLM)`);
	}

	console.log(`💱 Swapping ${xlmToSwap} XLM → HITZ via Soroswap...`);

	// Execute swap
	const swapResult = await soroswap.swapXLMToHITZ(xlmToSwap, env.ISSUER_SEED);
	const hitzAmount = swapResult.hitzAmount;

	console.log(`✅ Swap complete: ${xlmToSwap} XLM → ${hitzAmount} HITZ (tx: ${swapResult.txHash})`);

	// Send HITZ to user
	let user = await algolia.getUserByEmail(email);

	if (!user) {
		// Create new user
		const username = email.split('@')[0];
		const ctx: Context = { env };

		await createUserWithEmailResolver(null, { email, username, displayName: username }, ctx);
		user = await algolia.getUserByEmail(email);

		if (!user || !user.publicKey) {
			throw new Error(`Failed to create user account properly: ${!user ? 'User not found' : 'Missing public key'}`);
		}
	}

	if (!user.publicKey) {
		throw new Error('User exists but has no public key');
	}

	// Ensure user has HITZ trustline
	if (user.seed) {
		const Encryption = (await import('src/util/encryption')).default;
		const encryption = new Encryption(env);
		const userSeed = await encryption.decrypt(user.seed);
		await stellar.ensureHitzTrustline(userSeed);
	}

	// Transfer HITZ from issuer to user
	await contract.transferHitz(env.ISSUER_SEED, user.publicKey, hitzAmount);

	console.log(`💸 Sent ${hitzAmount} HITZ to ${user.publicKey} (${email})`);
}
