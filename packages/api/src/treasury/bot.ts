import { Keypair } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';
import { syncAllAPRsToAlgolia } from './sync-aprs';

function ensureEnv(env: Env, key: keyof Env) {
	if (!env[key]) {
		throw new Error(`Missing required env variable ${String(key)}`);
	}
}

export interface TreasuryRunResult {
	status: 'skipped' | 'submitted';
	reason?: string;
	txHash?: string;
	hitzDistributed?: string;
	entriesCount?: number;
}

// Bitcoin-like distribution rate: 0.05% of treasury balance per day
// This creates a 12+ year emission curve similar to Bitcoin's halving schedule:
//   - Year 4:  ~52% distributed
//   - Year 8:  ~77% distributed  
//   - Year 12: ~88% distributed
// Prevents liquidity drain while providing sustainable long-term rewards
const DAILY_DISTRIBUTION_RATE_BPS = 5; // 0.05% = 5 basis points

/**
 * Treasury Bot - Bitcoin-Like Distribution Mode
 * 
 * Since the HITZ supply is fully issued, this bot:
 * 1. Checks treasury HITZ balance (from fees or recovered funds)
 * 2. Calculates 0.05% of balance to distribute (Bitcoin-like rate limiting)
 * 3. Distributes to entry reward pools proportionally by escrow
 * 4. Syncs APRs to Algolia
 * 
 * RATE LIMITING: Only 0.05% of treasury distributed per day
 * This matches Bitcoin's ~12 year emission curve and ensures:
 * - Sustainable rewards for 12+ years
 * - No market flooding that could crash the price
 * - Gradual decline mimicking Bitcoin's halving
 * 
 * NO oracle updates - price stays fixed to prevent manipulation.
 * NO minting - supply is exhausted.
 */
export async function runTreasuryBot(env: Env): Promise<TreasuryRunResult> {
	try {
		console.log('================================================');
		console.log('🏦 TREASURY BOT - BITCOIN-LIKE DISTRIBUTION');
		console.log('================================================');
		console.log('Timestamp:', new Date().toISOString());
		console.log('');
		console.log('ℹ️  Supply fully issued - distribution only mode');
		console.log('ℹ️  No oracle updates (price fixed for safety)');
		console.log(`ℹ️  Distribution rate: 0.05% of treasury per day (12-year curve)`);
		console.log('');
		
		ensureEnv(env, 'TREASURY_SEED');
		const treasuryKeys = Keypair.fromSecret(env.TREASURY_SEED as string);
		const treasuryAddress = treasuryKeys.publicKey();

		const contract = new ContractClient(env);

		// Step 1: Check treasury HITZ balance
		console.log('📊 Checking treasury HITZ balance...');
		const currentHitzBalance = await contract.getHitzBalance(treasuryAddress);
		const currentHitzBalanceBigInt = BigInt(currentHitzBalance);
		const hitzDisplay = Number(currentHitzBalance) / 10_000_000;
		
		console.log(`   Treasury balance: ${hitzDisplay.toLocaleString()} HITZ`);

		// Step 2: Calculate rate-limited distribution amount (0.05% of balance)
		// 0.05% = 5 basis points = 5/10000
		const MIN_DISTRIBUTION_AMOUNT = BigInt(10_000_000); // 1 HITZ minimum
		const amountToDistribute = currentHitzBalanceBigInt * BigInt(DAILY_DISTRIBUTION_RATE_BPS) / BigInt(10000);
		const distributeDisplay = Number(amountToDistribute) / 10_000_000;
		
		console.log(`   Today's distribution (0.05%): ${distributeDisplay.toLocaleString()} HITZ`);
		
		if (amountToDistribute < MIN_DISTRIBUTION_AMOUNT) {
			console.log('');
			console.log('⏭️  SKIPPING: Distribution amount below minimum (1 HITZ)');
			console.log(`   Calculated: ${distributeDisplay} HITZ`);
			console.log(`   Minimum: 1 HITZ`);
			return {
				status: 'skipped',
				reason: `Distribution amount ${distributeDisplay} HITZ below minimum (need at least 1 HITZ)`
			};
		}
		
		console.log('');
		console.log(`💰 Distributing ${distributeDisplay.toLocaleString()} HITZ to entries...`);
		console.log(`   (${hitzDisplay.toLocaleString()} HITZ will remain in treasury)`);
		
		// Use 3-phase batched distribution for scalability
		// Pass the rate-limited amount, not the full balance
		const distResult = await contract.distributeRewardsBatch(
			env.TREASURY_SEED as string,
			amountToDistribute  // Rate-limited amount, not full balance
		);
		
		console.log('');
		console.log('✅ Distribution complete!');
		console.log(`   Entries with escrow: ${distResult.totalEntries}`);
		console.log(`   Total escrow: ${(Number(distResult.totalEscrow) / 10_000_000).toLocaleString()} HITZ`);
		console.log(`   HITZ distributed: ${(Number(distResult.hitzDistributed) / 10_000_000).toLocaleString()} HITZ`);

		// Step 3: Sync APRs to Algolia
		console.log('');
		console.log('📈 Syncing APRs to Algolia...');
		const syncResult = await syncAllAPRsToAlgolia(env);
		console.log(`✅ APR sync: ${syncResult.entriesSynced} entries updated`);
		if (syncResult.errors.length > 0) {
			console.warn(`⚠️  ${syncResult.errors.length} sync errors:`, syncResult.errors.slice(0, 3));
		}

		console.log('');
		console.log('================================================');
		console.log('🎉 TREASURY BOT COMPLETED');
		console.log('================================================');
		console.log(`   Distributed: ${distributeDisplay.toLocaleString()} HITZ (0.05% of ${hitzDisplay.toLocaleString()} HITZ)`);
		console.log(`   To entries: ${distResult.totalEntries}`);
		console.log(`   Remaining in treasury: ${(hitzDisplay - distributeDisplay).toLocaleString()} HITZ`);
		console.log('');
		
		return {
			status: 'submitted',
			hitzDistributed: amountToDistribute.toString(),
			entriesCount: distResult.totalEntries,
		};
	} catch (error: any) {
		console.error('');
		console.error('❌ TREASURY BOT FAILED');
		console.error('Error:', error?.message || error);
		console.error('Stack:', error?.stack);
		return {
			status: 'skipped',
			reason: error?.message || 'Unknown error',
		};
	}
}
