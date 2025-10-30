import { Asset, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, Account } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';
import { runOracleBot } from './oracle-bot';
import { syncAllAPRsToAlgolia } from './sync-aprs';

const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const MAINNET_HORIZON_URL = 'https://horizon.stellar.org';
const DEFAULT_BUFFER = 1; // Keep 1 XLM buffer by default
const STROOPS = 10_000_000;

// Aqua asset for path payment routing
const AQUA_CODE = 'AQUA';
const AQUA_ISSUER = 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA';

function getNetworkPassphrase(network: string | undefined) {
	return network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
}

function getHorizonUrl(network: string | undefined) {
	return network === 'testnet' ? TESTNET_HORIZON_URL : MAINNET_HORIZON_URL;
}

function toStellarAmount(value: number) {
	return (Math.floor(value * STROOPS) / STROOPS).toFixed(7);
}

type AccountData = {
    id: string;
    sequence: string;
    balances: Array<{
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        balance: string;
    }>;
    subentry_count: number;
    num_sponsoring: number;
    num_sponsored: number;
};

function computeMinBalance(account: AccountData) {
    const { subentry_count = 0, num_sponsoring = 0, num_sponsored = 0 } = account;
	return (2 + subentry_count + num_sponsoring - num_sponsored) * 0.5;
}

async function fetchJson<T = any>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} fetching ${url}: ${text}`);
    }
    return (await res.json()) as T;
}

/**
 * Simulate a path payment to estimate how much HITZ we'll receive
 * Uses Horizon's /paths/strict-send endpoint
 */
async function estimatePathPayment(
	horizonUrl: string,
	sourceAsset: Asset,
	sourceAmount: string,
	destinationAsset: Asset
): Promise<{ estimatedAmount: string; path: Asset[] }> {
	try {
		const params = new URLSearchParams({
			source_amount: sourceAmount,
			source_asset_type: sourceAsset.isNative() ? 'native' : sourceAsset.getAssetType(),
			destination_assets: `${destinationAsset.getCode()}:${destinationAsset.getIssuer()}`,
		});

		if (!sourceAsset.isNative()) {
			params.set('source_asset_code', sourceAsset.getCode());
			params.set('source_asset_issuer', sourceAsset.getIssuer());
		}

		const response: any = await fetchJson(`${horizonUrl}/paths/strict-send?${params.toString()}`);
		
		if (!response?._embedded?.records?.length) {
			console.log('No payment paths found');
			return { estimatedAmount: '0', path: [] };
		}

		// Get the best path (first one, they're sorted by best rate)
		const bestPath = response._embedded.records[0];
		const estimatedAmount = bestPath.destination_amount;
		
		// Parse the path assets
		const pathAssets: Asset[] = bestPath.path.map((p: any) => {
			if (p.asset_type === 'native') {
				return Asset.native();
			}
			return new Asset(p.asset_code, p.asset_issuer);
		});

		console.log(`Path payment estimate: ${sourceAmount} XLM → ${estimatedAmount} HITZ via ${pathAssets.length} hop(s)`);
		
		return { estimatedAmount, path: pathAssets };
	} catch (error) {
		console.error('Failed to estimate path payment:', error);
		return { estimatedAmount: '0', path: [] };
	}
}

function ensureEnv(env: Env, key: keyof Env) {
	if (!env[key]) {
		throw new Error(`Missing required env variable ${String(key)}`);
	}
}

function fetchWithRequestInit(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	return fetch(input, init);
}

async function resolveHitzSymbol(env: Env) {
	try {
		const contractClient = new ContractClient(env);
		const symbol = await contractClient.getHitzSymbol();
		if (symbol) {
			return symbol;
		}
	} catch (error) {
		console.log('treasury-bot: failed to fetch HITZ symbol, falling back to default', error);
	}
	return 'HITZ';
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
		console.log('=== TREASURY BOT STARTING ===');
		console.log('Timestamp:', new Date().toISOString());
		
		// Step 1: Update oracle price first (treasury bot will use this for dynamic emission)
		// CRITICAL: Oracle bot now throws on failure - no fallbacks!
		// If oracle fails, entire treasury bot should stop to prevent incorrect pricing
		try {
			const oracleResult = await runOracleBot(env);
			console.log('Oracle bot result:', oracleResult);
		} catch (oracleError: any) {
			console.error('❌ CRITICAL: Oracle bot failed! Stopping treasury bot to prevent incorrect pricing.');
			console.error('Oracle error:', oracleError?.message || oracleError);
			throw new Error(`Oracle bot failure: ${oracleError?.message || 'Unknown error'}`);
		}
		
		ensureEnv(env, 'TREASURY_SEED');
		ensureEnv(env, 'ISSUER_ID');
		const treasuryKeys = Keypair.fromSecret(env.TREASURY_SEED as string);
		const treasuryAddress = treasuryKeys.publicKey();

		// Step 2: Distribute existing HITZ balance FIRST (before buying more)
		console.log('Checking treasury HITZ balance for distribution...');
		try {
			const contract = new ContractClient(env);
			const currentHitzBalance = await contract.getHitzBalance(treasuryAddress);
			const currentHitzBalanceBigInt = BigInt(currentHitzBalance);
			
			console.log(`Treasury HITZ balance: ${Number(currentHitzBalance) / 10_000_000} HITZ`);

			// Distribute if we have significant HITZ (> 1 HITZ to avoid dust)
			const MIN_DISTRIBUTION_AMOUNT = BigInt(10_000_000); // 1 HITZ
			if (currentHitzBalanceBigInt >= MIN_DISTRIBUTION_AMOUNT) {
				console.log(`Distributing ${Number(currentHitzBalance) / 10_000_000} HITZ from treasury...`);
				
				// Use 3-phase batched distribution to handle systems with many entries
				// Phase 1: Calculate total escrow (40 entries per batch, read-only)
				// Phase 2: Initialize distribution with HITZ transfer
				// Phase 3: Distribute rewards (15 entries per batch, write operations)
				const distResult = await contract.distributeRewardsBatch(
					env.TREASURY_SEED as string,
					currentHitzBalanceBigInt
					// Using default batch sizes: calcBatchSize=40, distBatchSize=15
				);
				console.log(`✅ Distribution successful!`);
				console.log(`  Phase 1: ${distResult.phase1Batches} calculation batches`);
				console.log(`  Phase 3: ${distResult.phase3Batches} distribution batches`);
				console.log(`  Total entries: ${distResult.totalEntries}`);
				console.log(`  Total escrow: ${distResult.totalEscrow} XLM`);
				console.log(`  HITZ distributed: ${distResult.hitzDistributed} HITZ`);

				// Sync APRs to Algolia after successful distribution
				console.log('Syncing APRs to Algolia...');
				const syncResult = await syncAllAPRsToAlgolia(env);
				console.log(`✅ APR sync complete: ${syncResult.entriesSynced} entries updated`);
				if (syncResult.errors.length > 0) {
					console.warn(`⚠️ APR sync had ${syncResult.errors.length} errors:`, syncResult.errors.slice(0, 5));
				}
			} else {
				console.log('Treasury HITZ balance below minimum distribution threshold, skipping distribution');
			}
		} catch (distError: any) {
			// Log but don't fail - we still want to buy more HITZ
			console.error('❌ Failed to distribute existing HITZ:', distError?.message || distError);
			console.error('Stack:', distError?.stack);
			// Don't return here - continue with buying more HITZ
		}
		const networkPassphrase = getNetworkPassphrase(env.STELLAR_NETWORK);
		const horizonUrl = getHorizonUrl(env.STELLAR_NETWORK);
		const hitzAssetCode = await resolveHitzSymbol(env);
		console.log(`Resolved HITZ asset code: "${hitzAssetCode}"`);
		console.log(`ISSUER_ID: ${env.ISSUER_ID}`);
	
		const hitzAsset = new Asset(hitzAssetCode, env.ISSUER_ID);
		const aquaAsset = new Asset(AQUA_CODE, AQUA_ISSUER);
		const buffer = DEFAULT_BUFFER;

        const account: AccountData = await fetchJson(`${horizonUrl}/accounts/${treasuryKeys.publicKey()}`);
        const nativeBalance = (account.balances || []).find((b: any) => b.asset_type === 'native');
	if (!nativeBalance) {
		throw new Error('Treasury account has no XLM balance');
	}
        const totalXlm = parseFloat((nativeBalance as any).balance);
        const minBalance = computeMinBalance(account) + buffer;

	// Check if trustlines exist for HITZ and AQUA
        const hasHitzTrustline = (account.balances || []).some(
            (b: any) => b.asset_code === hitzAssetCode && b.asset_issuer === env.ISSUER_ID
        );
		const hasAquaTrustline = (account.balances || []).some(
            (b: any) => b.asset_code === AQUA_CODE && b.asset_issuer === AQUA_ISSUER
        );
		
		console.log(`Trust lines: HITZ=${hasHitzTrustline}, AQUA=${hasAquaTrustline}`);
	
	// Calculate how many operations we'll need for the transaction
	const baseFee = Number.parseInt(typeof BASE_FEE === 'string' ? BASE_FEE : `${BASE_FEE}`, 10) || 100;
	let numOperations = 1; // Path payment operation
	if (!hasHitzTrustline) {
		numOperations++; // Add HITZ trustline operation
	}
	if (!hasAquaTrustline) {
		numOperations++; // Add AQUA trustline operation
	}
	
	// Calculate total transaction fee in XLM (fee is in stroops, convert to XLM)
	const transactionFeeXlm = (baseFee * numOperations) / 10_000_000;
	
	// Add a small extra buffer for transaction fee variance (0.01 XLM)
	const feeBuffer = 0.01;
	
	// Calculate spendable XLM (all available balance minus reserves and fees)
	const spendable = totalXlm - minBalance - transactionFeeXlm - feeBuffer;
	
	console.log(`Treasury balance: ${totalXlm.toFixed(2)} XLM`);
	console.log(`Min reserve: ${minBalance.toFixed(2)} XLM, tx fee: ${transactionFeeXlm.toFixed(7)} XLM (${numOperations} ops), fee buffer: ${feeBuffer} XLM`);
	console.log(`Spendable XLM: ${spendable.toFixed(7)} XLM`);
	
	if (spendable <= 1) {
		console.log('❌ SKIPPING: Insufficient spendable XLM (minimum 1 XLM)');
		return { status: 'skipped', reason: `Insufficient spendable XLM (${spendable.toFixed(2)} XLM available, need at least 1 XLM)` };
	}
	
	const sendAmount = toStellarAmount(spendable); // Exactly how much XLM we'll send
	
	// Estimate how much HITZ we'll receive via path payment
	const pathEstimate = await estimatePathPayment(horizonUrl, Asset.native(), sendAmount, hitzAsset);
	
	if (parseFloat(pathEstimate.estimatedAmount) <= 0) {
		console.log('❌ SKIPPING: No valid payment path found or estimated amount is zero');
		return { status: 'skipped', reason: 'No valid payment path found' };
	}
	
	// Use 95% of estimated amount as minimum to allow for slippage
	const minDestAmount = (parseFloat(pathEstimate.estimatedAmount) * 0.95).toFixed(7);
	
	console.log(`Will send ${sendAmount} XLM via path payment`);
	console.log(`Estimated to receive: ${pathEstimate.estimatedAmount} HITZ`);
	console.log(`Minimum accepted (95%): ${minDestAmount} HITZ`);
	console.log(`Path: XLM → ${pathEstimate.path.map(a => a.isNative() ? 'XLM' : a.getCode()).join(' → ')} → HITZ`);

		// Build path payment transaction
		const operations: any[] = [];
		
		// Add trustlines if needed
		if (!hasHitzTrustline) {
			console.log('Adding HITZ trustline operation');
			operations.push(
				Operation.changeTrust({
					asset: hitzAsset,
				})
			);
		}
		
		if (!hasAquaTrustline) {
			console.log('Adding AQUA trustline operation');
			operations.push(
				Operation.changeTrust({
					asset: aquaAsset,
				})
			);
		}
		
		// Add path payment strict send operation
		operations.push(
			Operation.pathPaymentStrictSend({
				sendAsset: Asset.native(),
				sendAmount: sendAmount,
				destination: treasuryKeys.publicKey(), // Send HITZ back to treasury
				destAsset: hitzAsset,
				destMin: minDestAmount,
				path: pathEstimate.path, // Use the path from Horizon's path finding
			})
		);
		
		console.log(`Submitting path payment transaction with ${operations.length} operations...`);
		const builder = new TransactionBuilder(new Account(account.id, account.sequence), {
			fee: (baseFee * operations.length).toString(),
			networkPassphrase,
		});
		operations.forEach((op) => builder.addOperation(op));
		const transaction = builder.setTimeout(0).build();
		transaction.sign(treasuryKeys);
		
		const xdr = transaction.toXDR();
		const response = await fetch(`${horizonUrl}/transactions?tx=${encodeURIComponent(xdr)}`, { method: 'POST' });
		if (!response.ok) {
			const errBody = await response.text();
			console.error('❌ Path payment transaction failed:', errBody);
			throw new Error(`Path payment failed (${response.status}): ${errBody}`);
		}
		const result: any = await response.json();
		console.log('✅ Path payment successful! Hash:', result?.hash);
		
		console.log('=== TREASURY BOT COMPLETED SUCCESSFULLY ===');
		console.log(`Sent ${sendAmount} XLM via path payment to buy HITZ`);
		
		return {
			status: 'submitted',
			txHash: result?.hash,
			buyAmount: pathEstimate.estimatedAmount,
			spendAmount: sendAmount,
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

