import { Keypair } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';
import { syncAllAPRsToAlgolia } from './sync-aprs';
import { SmartWalletWrapper } from '../util/smart-wallet';

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
const DAILY_DISTRIBUTION_RATE_BPS = 5; // 0.05% = 5 basis points

/**
 * Treasury Bot - Bitcoin-Like Distribution Mode
 * 
 * Supports:
 * - Standard Keypair Treasury (Legacy)
 * - Smart Wallet Treasury (New, Secure)
 */
export async function runTreasuryBot(env: Env): Promise<TreasuryRunResult> {
	try {
		console.log('================================================');
		console.log('🏦 TREASURY BOT - BITCOIN-LIKE DISTRIBUTION');
		console.log('================================================');
		console.log('Timestamp:', new Date().toISOString());
		console.log('');

		let signer: string | SmartWalletWrapper;
		let treasuryAddress: string;
		let useSmartWallet = false;

		// Initialize Signer (Smart Wallet or Keypair)
		if (env.TREASURY_SMART_WALLET_ID && env.TREASURY_RELAYER_SEED) {
			console.log('🔒 Using Smart Wallet Treasury');
			const wrapper = new SmartWalletWrapper(
				env.TREASURY_SMART_WALLET_ID as string,
				env.TREASURY_RELAYER_SEED as string
			);
			signer = wrapper;
			treasuryAddress = wrapper.getContractId();
			useSmartWallet = true;

			ensureEnv(env, 'HITZ_TOKEN_ID'); // Required for balance check on Smart Wallet
		} else {
			console.log('🔑 Using Standard Keypair Treasury');
			ensureEnv(env, 'TREASURY_SEED');
			signer = env.TREASURY_SEED as string;
			treasuryAddress = Keypair.fromSecret(signer).publicKey();
		}

		console.log(`info: Treasury Address: ${treasuryAddress}`);
		console.log('ℹ️  Supply fully issued - distribution only mode');
		console.log('ℹ️  No oracle updates (price fixed for safety)');
		console.log(`ℹ️  Distribution rate: 0.05% of treasury per day (12-year curve)`);
		console.log('');

		const contract = new ContractClient(env);

		// Step 1: Check treasury HITZ balance
		console.log('📊 Checking treasury HITZ balance...');
		let currentHitzBalance: number = 0;

		if (useSmartWallet) {
			// Check balance via Contract (C-address)
			currentHitzBalance = await contract.getTokenBalance(
				env.HITZ_TOKEN_ID as string,
				treasuryAddress
			);
		} else {
			// Check balance via Horizon (G-address)
			currentHitzBalance = await contract.getHitzBalance(treasuryAddress);
		}

		const currentHitzBalanceBigInt = BigInt(Math.floor(currentHitzBalance)); // stroops
		const hitzDisplay = currentHitzBalance / 10_000_000;

		console.log(`   Treasury balance: ${hitzDisplay.toLocaleString()} HITZ`);

		// Step 2: Calculate rate-limited distribution amount (0.05% of balance)
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

		// Use 3-phase batched distribution
		const distResult = await contract.distributeRewardsBatch(
			signer,
			amountToDistribute
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
