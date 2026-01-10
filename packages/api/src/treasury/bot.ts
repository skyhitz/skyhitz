import { Keypair } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';
import { runOracleBot } from './oracle-bot';
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
	buyAmount?: string;
	spendAmount?: string;
}

export async function runTreasuryBot(env: Env): Promise<TreasuryRunResult> {
	try {
		console.log('=== TREASURY BOT STARTING (HITZ-ONLY MODE) ===');
		console.log('Timestamp:', new Date().toISOString());
		console.log('Note: Treasury receives HITZ fees directly from users');
		console.log('');
		
		// Step 1: Update oracle price (for dynamic emission and market pricing)
		console.log('Updating oracle price...');
		try {
			const oracleResult = await runOracleBot(env);
			console.log('✅ Oracle bot result:', oracleResult);
		} catch (oracleError: any) {
			console.error('❌ CRITICAL: Oracle bot failed!');
			console.error('Oracle error:', oracleError?.message || oracleError);
			throw new Error(`Oracle bot failure: ${oracleError?.message || 'Unknown error'}`);
		}
		
		ensureEnv(env, 'TREASURY_SEED');
		const treasuryKeys = Keypair.fromSecret(env.TREASURY_SEED as string);
		const treasuryAddress = treasuryKeys.publicKey();

		// Step 2: Check treasury HITZ balance
		console.log('');
		console.log('Checking treasury HITZ balance...');
		const contract = new ContractClient(env);
		const currentHitzBalance = await contract.getHitzBalance(treasuryAddress);
		const currentHitzBalanceBigInt = BigInt(currentHitzBalance);
		
		console.log(`Treasury HITZ balance: ${Number(currentHitzBalance) / 10_000_000} HITZ`);

		// Step 3: Distribute HITZ fees to entry reward pools
		const MIN_DISTRIBUTION_AMOUNT = BigInt(10_000_000); // 1 HITZ minimum
		
		if (currentHitzBalanceBigInt < MIN_DISTRIBUTION_AMOUNT) {
			console.log('❌ SKIPPING: Treasury HITZ balance below minimum (1 HITZ)');
			console.log(`   Current balance: ${Number(currentHitzBalance) / 10_000_000} HITZ`);
			return {
				status: 'skipped',
				reason: `Treasury has only ${Number(currentHitzBalance) / 10_000_000} HITZ (need at least 1 HITZ for distribution)`
			};
		}
		
		console.log('');
		console.log(`Distributing ${Number(currentHitzBalance) / 10_000_000} HITZ to entry reward pools...`);
		
		// Use 3-phase batched distribution for scalability
		const distResult = await contract.distributeRewardsBatch(
			env.TREASURY_SEED as string,
			currentHitzBalanceBigInt
		);
		
		console.log('');
		console.log(`✅ Distribution successful!`);
		console.log(`  Phase 1: ${distResult.phase1Batches} calculation batches`);
		console.log(`  Phase 3: ${distResult.phase3Batches} distribution batches`);
		console.log(`  Total entries: ${distResult.totalEntries}`);
		console.log(`  Total escrow: ${distResult.totalEscrow} HITZ`);
		console.log(`  HITZ distributed: ${distResult.hitzDistributed} HITZ`);

		// Step 4: Sync APRs to Algolia
		console.log('');
		console.log('Syncing APRs to Algolia...');
		const syncResult = await syncAllAPRsToAlgolia(env);
		console.log(`✅ APR sync complete: ${syncResult.entriesSynced} entries updated`);
		if (syncResult.errors.length > 0) {
			console.warn(`⚠️ APR sync had ${syncResult.errors.length} errors:`, syncResult.errors.slice(0, 5));
		}

		
		console.log('');
		console.log('=== TREASURY BOT COMPLETED SUCCESSFULLY ===');
		console.log(`✅ Oracle updated`);
		console.log(`✅ Distributed ${Number(currentHitzBalance) / 10_000_000} HITZ to ${distResult.totalEntries} entries`);
		console.log(`✅ APRs synced to Algolia`);
		console.log('');
		console.log('Note: In HITZ-only mode, treasury receives fees directly from users');
		console.log('No XLM→HITZ conversion needed!');
		
		return {
			status: 'submitted',
			buyAmount: currentHitzBalance.toString(),
			spendAmount: '0',
		};
	} catch (error: any) {
		console.error('=== TREASURY BOT FAILED ===');
		console.error('Error message:', error?.message || error);
		console.error('Error stack:', error?.stack);
		return {
			status: 'skipped',
			reason: error?.message || 'Unknown error',
		};
	}
}

