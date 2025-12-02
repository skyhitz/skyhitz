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

// Soroban contract addresses for Soroswap DEX aggregator
const XLM_CONTRACT_ID = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
const HITZ_CONTRACT_ID = 'CBS5ZVKSSUKF4JY77CKUZPN72EDUM3OOGPYZKFC3KQVONXPJTF6UODD7';

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
	network: string | undefined,
	apiKey: string
): Promise<{ fullQuote: any; estimatedOut: string; priceImpact: string }> {
	const amountInStroops = xlmAmount.toString();
	
	// Soroswap API base URL (no /api/ prefix - endpoints are at root)
	const apiUrl = 'https://api.soroswap.finance';
	
	// Network parameter (mainnet or testnet)
	const networkParam = network === 'testnet' ? 'testnet' : 'mainnet';
	
	// Build the quote request body (must be POST with JSON)
	const requestBody = {
		assetIn: XLM_CONTRACT_ID,  // XLM contract address
		assetOut: HITZ_CONTRACT_ID, // HITZ contract address
		amount: amountInStroops, // Amount in stroops (string format per API docs)
		tradeType: 'EXACT_IN',
		protocols: ['aqua', 'sdex', 'soroswap', 'phoenix'], // Flat array, not nested
		slippageBps: '100', // 1% slippage as string (per API docs)
		maxHops: 3, // Allow up to 3 hops for better rates
	};
	
	console.log(`🔍 Querying Soroswap for best route...`);
	console.log(`   Input: ${Number(xlmAmount) / STROOPS} XLM`);
	console.log(`   Output: HITZ (${HITZ_CONTRACT_ID.substring(0, 8)}...)`);
	console.log(`   Network: ${networkParam}`);
	
	const response = await fetch(`${apiUrl}/quote?network=${networkParam}`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Soroswap quote failed (${response.status}): ${errorText}`);
	}
	
	const quote: any = await response.json();
	
	// API returns rawTrade, not route
	if (!quote || !quote.rawTrade || !quote.amountOut) {
		throw new Error(`Invalid Soroswap quote response: ${JSON.stringify(quote).substring(0, 500)}`);
	}
	
	const estimatedOut = quote.amountOut;
	
	// Validate the estimated output amount
	const estimatedOutNum = Number(estimatedOut);
	if (!estimatedOut || estimatedOutNum <= 0 || !Number.isFinite(estimatedOutNum)) {
		throw new Error(`Invalid amountOut from Soroswap: ${estimatedOut}`);
	}
	
	const priceImpact = quote.priceImpactPct || '0'; // API returns priceImpactPct
	
	console.log(`✅ Soroswap route found:`);
	console.log(`   Expected output: ${Number(estimatedOut) / STROOPS} HITZ`);
	console.log(`   Price impact: ${priceImpact}%`);
	if (quote.rawTrade?.distribution) {
		const protocols = quote.rawTrade.distribution.map((d: any) => d.protocol_id).join(', ');
		console.log(`   Using protocols: ${protocols}`);
	}
	
	// Return the full quote response for the build step
	return {
		fullQuote: quote, // Full quote needed for /build endpoint
		estimatedOut,
		priceImpact,
	};
}

/**
 * Build the swap transaction using Soroswap API
 * @param quoteResponse - The full quote response object from Soroswap
 * @param fromAddress - The wallet address initiating the swap
 * @param network - Network (testnet or mainnet)
 * @param apiKey - Soroswap API key
 */
async function buildSoroswapTransaction(
	quoteResponse: any,
	fromAddress: string,
	network: string | undefined,
	apiKey: string
): Promise<string> {
	const apiUrl = 'https://api.soroswap.finance';
	const networkParam = network === 'testnet' ? 'testnet' : 'mainnet';
	
	console.log(`🔨 Building swap transaction...`);
	
	// Build request body per API docs
	const requestBody = {
		quote: quoteResponse, // Send the full quote response
		from: fromAddress,
		to: fromAddress, // Same wallet for treasury bot
	};
	
	const response = await fetch(`${apiUrl}/quote/build?network=${networkParam}`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
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

