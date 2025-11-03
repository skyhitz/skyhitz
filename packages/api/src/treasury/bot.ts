import { Asset, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, Account, Transaction } from '@stellar/stellar-sdk';
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
 * 
 * CRITICAL: Throws on failure - no fallbacks!
 * Returns the best path sorted by destination amount (most HITZ received)
 */
async function estimatePathPayment(
	horizonUrl: string,
	sourceAsset: Asset,
	sourceAmount: string,
	destinationAsset: Asset
): Promise<{ estimatedAmount: string; path: Asset[]; effectiveRate: number }> {
	const params = new URLSearchParams({
		source_amount: sourceAmount,
		source_asset_type: sourceAsset.isNative() ? 'native' : sourceAsset.getAssetType(),
		destination_assets: `${destinationAsset.getCode()}:${destinationAsset.getIssuer()}`,
		limit: '10', // Get top 10 paths to compare and log
	});

	if (!sourceAsset.isNative()) {
		params.set('source_asset_code', sourceAsset.getCode());
		params.set('source_asset_issuer', sourceAsset.getIssuer());
	}

	console.log(`Querying Horizon for payment paths: ${sourceAmount} XLM → HITZ`);
	const response: any = await fetchJson(`${horizonUrl}/paths/strict-send?${params.toString()}`);
	
	if (!response?._embedded?.records?.length) {
		throw new Error(`No payment paths found from ${sourceAmount} XLM to ${destinationAsset.getCode()}. Check DEX liquidity and trustlines.`);
	}

	// Horizon returns paths sorted by destination_amount DESC (best first)
	const paths = response._embedded.records;
	console.log(`\nFound ${paths.length} possible payment path${paths.length > 1 ? 's' : ''}:`);
	
	// Log top 5 paths for transparency
	paths.slice(0, Math.min(5, paths.length)).forEach((p: any, idx: number) => {
		const pathStr = p.path.length > 0 
			? p.path.map((a: any) => a.asset_type === 'native' ? 'XLM' : a.asset_code).join(' → ')
			: 'direct';
		const rate = parseFloat(sourceAmount) / parseFloat(p.destination_amount);
		console.log(`  ${idx + 1}. ${sourceAmount} XLM → ${parseFloat(p.destination_amount).toFixed(2)} HITZ via [${pathStr}] (rate: ${rate.toFixed(7)} XLM/HITZ)`);
	});

	// Take the best path (first = highest destination amount = best rate)
	const bestPath = paths[0];
	const estimatedAmount = bestPath.destination_amount;
	
	// Strict validation of the estimated amount
	const estimatedFloat = parseFloat(estimatedAmount);
	if (!estimatedAmount || estimatedFloat <= 0 || !Number.isFinite(estimatedFloat)) {
		throw new Error(`Invalid destination amount in best path: ${estimatedAmount}`);
	}
	
	// Parse the path assets
	const pathAssets: Asset[] = bestPath.path.map((p: any) => {
		if (p.asset_type === 'native') {
			return Asset.native();
		}
		return new Asset(p.asset_code, p.asset_issuer);
	});

	// Calculate effective rate (XLM per HITZ)
	const effectiveRate = parseFloat(sourceAmount) / estimatedFloat;
	
	console.log(`\n✅ Selected best path (${pathAssets.length} hop${pathAssets.length !== 1 ? 's' : ''}):`);
	console.log(`   Sending: ${sourceAmount} XLM`);
	console.log(`   Receiving: ${estimatedFloat.toFixed(2)} HITZ`);
	console.log(`   Effective rate: ${effectiveRate.toFixed(7)} XLM per HITZ`);
	
	// Sanity check: warn if rate seems unreasonable
	// Most crypto pairs shouldn't exceed 1:1, but don't fail - market could be volatile
	if (effectiveRate > 1.0) {
		console.warn(`⚠️  WARNING: Effective rate is high (${effectiveRate.toFixed(4)} XLM/HITZ).`);
		console.warn(`   This means 1 HITZ costs more than 1 XLM. Verify this is expected!`);
	}
	
	// Extra paranoia: check if we're getting less than 1 HITZ per 1 XLM
	// This would be unusual but not impossible
	const hitzPerXlm = estimatedFloat / parseFloat(sourceAmount);
	if (hitzPerXlm < 1.0) {
		console.warn(`⚠️  WARNING: You're getting less than 1 HITZ per XLM (${hitzPerXlm.toFixed(4)} HITZ/XLM)`);
		console.warn(`   This means HITZ is more expensive than XLM. Double-check market conditions!`);
	}
	
	return { estimatedAmount, path: pathAssets, effectiveRate };
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

/**
 * Get the best swap quote from Soroswap API
 * Soroswap aggregates liquidity from Soroswap, Aqua, Phoenix, and other DEXes
 */
async function getSoroswapQuote(
	xlmAmount: bigint,
	hitzAssetCode: string,
	hitzIssuer: string,
	apiKey: string
): Promise<{ route: any; estimatedOut: string; priceImpact: string }> {
	const amountInStroops = xlmAmount.toString();
	
	// Soroswap API endpoint
	const apiUrl = 'https://api.soroswap.finance/api';
	
	// Build the quote request
	// For XLM (native), use 'native' as the asset identifier
	// For HITZ, use the format: 'code:issuer'
	const params = new URLSearchParams({
		amountIn: amountInStroops,
		tokenIn: 'native', // XLM native asset
		tokenOut: `${hitzAssetCode}:${hitzIssuer}`,
		tradeType: 'EXACT_IN',
	});
	
	console.log(`🔍 Querying Soroswap for best route...`);
	console.log(`   Input: ${Number(xlmAmount) / STROOPS} XLM`);
	console.log(`   Output: ${hitzAssetCode}`);
	
	const response = await fetch(`${apiUrl}/quote?${params.toString()}`, {
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Soroswap quote failed (${response.status}): ${errorText}`);
	}
	
	const quote: any = await response.json();
	
	if (!quote || !quote.route || !quote.amountOut) {
		throw new Error(`Invalid Soroswap quote response: ${JSON.stringify(quote).substring(0, 500)}`);
	}
	
	const estimatedOut = quote.amountOut;
	
	// Validate the estimated output amount
	const estimatedOutNum = Number(estimatedOut);
	if (!estimatedOut || estimatedOutNum <= 0 || !Number.isFinite(estimatedOutNum)) {
		throw new Error(`Invalid amountOut from Soroswap: ${estimatedOut}`);
	}
	
	const priceImpact = quote.priceImpact || '0';
	
	console.log(`✅ Soroswap route found:`);
	console.log(`   Expected output: ${Number(estimatedOut) / STROOPS} ${hitzAssetCode}`);
	console.log(`   Price impact: ${priceImpact}%`);
	if (quote.route?.path) {
		const pathStr = quote.route.path.map((p: any) => p.symbol || p.code || 'unknown').join(' → ');
		console.log(`   Path: ${pathStr}`);
	}
	
	return {
		route: quote.route,
		estimatedOut,
		priceImpact,
	};
}

/**
 * Build the swap transaction using Soroswap API
 */
async function buildSoroswapTransaction(
	route: any,
	fromAddress: string,
	slippageBps: string,
	apiKey: string
): Promise<string> {
	const apiUrl = 'https://api.soroswap.finance/api';
	
	console.log(`🔨 Building swap transaction...`);
	
	const response = await fetch(`${apiUrl}/build`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			route,
			from: fromAddress,
			slippageBps,
		}),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Soroswap build failed (${response.status}): ${errorText}`);
	}
	
	const result: any = await response.json();
	
	if (!result || !result.xdr || typeof result.xdr !== 'string') {
		throw new Error(`Invalid Soroswap build response: ${JSON.stringify(result).substring(0, 500)}`);
	}
	
	// Validate XDR is a non-empty string
	const xdr = result.xdr.trim();
	if (xdr.length === 0) {
		throw new Error('Soroswap returned empty XDR string');
	}
	
	console.log(`✅ Transaction XDR built successfully (length: ${xdr.length})`);
	
	return xdr;
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
	
	// ============================================================================
	// SOROSWAP DEX AGGREGATOR INTEGRATION
	// ============================================================================
	// Uses Soroswap API to aggregate liquidity from Soroswap, Aqua, Phoenix, etc.
	// to find the best rate for buying HITZ with XLM
	// ============================================================================
	
	// Check for Soroswap API key
	if (!env.SOROSWAP_API_KEY) {
		console.error('❌ SOROSWAP_API_KEY not configured!');
		throw new Error('SOROSWAP_API_KEY environment variable is required. Get one at https://api.soroswap.finance/login');
	}
	
	const xlmAmountBigInt = BigInt(Math.floor(spendable * STROOPS));
	const sendAmount = toStellarAmount(spendable);
	
	// ============================================================================
	// STEP 1: CREATE TRUSTLINES IF NEEDED (MUST BE BEFORE SOROSWAP BUILD)
	// ============================================================================
	// Soroswap builds transactions with current sequence number, so we must
	// create any missing trustlines FIRST to avoid sequence conflicts
	// ============================================================================
	
	if (!hasHitzTrustline || !hasAquaTrustline) {
		console.log(`\n⚠️  Missing trustlines, creating them first...`);
		const trustlineOps: any[] = [];
		
		if (!hasHitzTrustline) {
			console.log(`   Adding HITZ trustline`);
			trustlineOps.push(Operation.changeTrust({ asset: hitzAsset }));
		}
		
		if (!hasAquaTrustline) {
			console.log(`   Adding AQUA trustline`);
			trustlineOps.push(Operation.changeTrust({ asset: aquaAsset }));
		}
		
		const trustlineBuilder = new TransactionBuilder(new Account(account.id, account.sequence), {
			fee: (baseFee * trustlineOps.length).toString(),
			networkPassphrase,
		});
		trustlineOps.forEach((op) => trustlineBuilder.addOperation(op));
		const trustlineTx = trustlineBuilder.setTimeout(0).build();
		trustlineTx.sign(treasuryKeys);
		
		const trustlineXdr = trustlineTx.toXDR();
		const trustlineResponse = await fetch(`${horizonUrl}/transactions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: `tx=${encodeURIComponent(trustlineXdr)}`,
		});
		
		if (!trustlineResponse.ok) {
			const errBody = await trustlineResponse.text();
			console.error('❌ Trustline transaction failed:', errBody);
			throw new Error(`Trustline setup failed (${trustlineResponse.status}): ${errBody}`);
		}
		
		console.log(`✅ Trustlines created successfully`);
		
		// IMPORTANT: Account sequence has now incremented
		// Soroswap will query the latest sequence when building
	}
	
	console.log(`\n💱 Buying HITZ via Soroswap DEX Aggregator...`);
	console.log(`   Available: ${spendable.toFixed(2)} XLM`);
	
	// ============================================================================
	// STEP 2: GET QUOTE AND BUILD TRANSACTION
	// ============================================================================
	// Now that trustlines are set up, Soroswap will build with correct sequence
	// ============================================================================
	
	// Get best quote from Soroswap (aggregates all liquidity sources)
	let quote;
	try {
		quote = await getSoroswapQuote(
			xlmAmountBigInt,
			hitzAssetCode,
			env.ISSUER_ID,
			env.SOROSWAP_API_KEY
		);
	} catch (quoteError: any) {
		console.error('❌ CRITICAL: Soroswap quote failed!');
		console.error('Quote error:', quoteError?.message || quoteError);
		throw new Error(`Soroswap quote failure: ${quoteError?.message || 'Unknown error'}`);
	}
	
	// Calculate expected output with slippage protection
	const estimatedHitz = Number(quote.estimatedOut) / STROOPS;
	const slippageBps = '500'; // 5% slippage tolerance (500 basis points)
	const minHitz = estimatedHitz * 0.95;
	
	console.log(`\n📊 Swap Summary:`);
	console.log(`   Sending: ${sendAmount} XLM`);
	console.log(`   Expected: ${estimatedHitz.toFixed(2)} HITZ`);
	console.log(`   Minimum (5% slippage): ${minHitz.toFixed(2)} HITZ`);
	console.log(`   Price impact: ${quote.priceImpact}%`);
	
	// Build the swap transaction via Soroswap API
	let transactionXdr;
	try {
		transactionXdr = await buildSoroswapTransaction(
			quote.route,
			treasuryKeys.publicKey(),
			slippageBps,
			env.SOROSWAP_API_KEY
		);
	} catch (buildError: any) {
		console.error('❌ CRITICAL: Soroswap transaction build failed!');
		console.error('Build error:', buildError?.message || buildError);
		throw new Error(`Soroswap build failure: ${buildError?.message || 'Unknown error'}`);
	}
	
	// ============================================================================
	// STEP 3: PARSE, SIGN, AND SUBMIT SWAP TRANSACTION
	// ============================================================================
	
	// Parse the transaction XDR from Soroswap
	let transaction: Transaction;
	try {
		transaction = new Transaction(transactionXdr, networkPassphrase);
	} catch (parseError: any) {
		console.error('❌ CRITICAL: Failed to parse transaction XDR!');
		console.error('Parse error:', parseError?.message || parseError);
		throw new Error(`XDR parsing failure: ${parseError?.message || 'Unknown error'}`);
	}
	
	// Sign the swap transaction with treasury keys
	console.log(`\n🔏 Signing swap transaction...`);
	transaction.sign(treasuryKeys);
	
	// Submit to Horizon
	console.log(`📤 Submitting swap transaction...`);
	const swapXdr = transaction.toXDR();
	const swapResponse = await fetch(`${horizonUrl}/transactions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `tx=${encodeURIComponent(swapXdr)}`,
	});
	
	if (!swapResponse.ok) {
		const errBody = await swapResponse.text();
		console.error('❌ Swap transaction failed:', errBody);
		throw new Error(`Swap failed (${swapResponse.status}): ${errBody}`);
	}
	
	const result: any = await swapResponse.json();
	console.log(`✅ Swap successful! Hash: ${result?.hash}`);
	
	console.log('\n=== TREASURY BOT COMPLETED SUCCESSFULLY ===');
	console.log(`✅ Oracle updated`);
	console.log(`✅ Existing HITZ distributed`);
	console.log(`✅ Bought ${estimatedHitz.toFixed(2)} HITZ with ${sendAmount} XLM`);
	console.log(`🔗 TX: ${result?.hash}`);
	
	return {
		status: 'submitted',
		txHash: result?.hash,
		buyAmount: quote.estimatedOut,
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

