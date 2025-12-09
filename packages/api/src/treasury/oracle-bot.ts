import ContractClient from '../../contract';
import { STROOPS, XLM_CONTRACT_ID, HITZ_CONTRACT_ID } from '../constants/stellar';

const PRICE_UPDATE_THRESHOLD = 0.001; // 0.1% change triggers update (more sensitive to price changes)
const UPDATE_INTERVAL = 3600; // 1 hour minimum between updates

// Use a representative trade size to get market price (not affected by small trade sizes)
const REPRESENTATIVE_XLM_AMOUNT = 50; // 50 XLM for representative pricing

interface OracleRunResult {
	status: 'updated' | 'skipped';
	reason?: string;
	oldPrice?: string;
	newPrice?: string;
	priceChange?: string;
}

/**
 * Fetch current HITZ/XLM market price from Soroswap API
 * Uses a representative trade amount to get accurate market pricing
 * 
 * CRITICAL: This function throws on any error - no fallbacks!
 * Fallback prices could result in massive losses if oracle is set incorrectly.
 */
async function fetchMarketPriceFromSoroswap(
	network: string | undefined,
	apiKey: string
): Promise<number> {
	const apiUrl = 'https://api.soroswap.finance';
	const networkParam = network === 'testnet' ? 'testnet' : 'mainnet';
	
	// Use representative amount (100 XLM) to get market price
	const amountInStroops = (REPRESENTATIVE_XLM_AMOUNT * STROOPS).toString();
	
	console.log(`🔍 Fetching HITZ market price from Soroswap...`);
	console.log(`   Using representative amount: ${REPRESENTATIVE_XLM_AMOUNT} XLM`);
	console.log(`   Network: ${networkParam}`);
	
	const requestBody = {
		assetIn: XLM_CONTRACT_ID,
		assetOut: HITZ_CONTRACT_ID,
		amount: amountInStroops,
		tradeType: 'EXACT_IN',
		protocols: ['aqua', 'sdex', 'soroswap', 'phoenix'],
		slippageBps: '100', // 1% slippage for quote
		maxHops: 3,
	};
	
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
	
	if (!quote || !quote.amountOut) {
		throw new Error(`Invalid Soroswap quote response: ${JSON.stringify(quote).substring(0, 500)}`);
	}
	
	// Calculate actual market rate: XLM per HITZ
	// amountIn is in stroops (XLM), amountOut is in stroops (HITZ)
	const amountInXlm = Number(quote.amountIn) / STROOPS;
	const amountOutHitz = Number(quote.amountOut) / STROOPS;
	const hitzPerXlm = amountOutHitz / amountInXlm; // How much HITZ you get per 1 XLM
	const xlmPerHitz = 1 / hitzPerXlm; // How much XLM you need per 1 HITZ (oracle format)
	
	if (!Number.isFinite(xlmPerHitz) || xlmPerHitz <= 0) {
		throw new Error(`Invalid calculated HITZ/XLM price: ${xlmPerHitz} (in: ${amountInXlm} XLM, out: ${amountOutHitz} HITZ)`);
	}
	
	const priceImpact = quote.priceImpactPct || '0';
	
	console.log(`✅ Soroswap market price:`);
	console.log(`   Rate: ${hitzPerXlm.toFixed(4)} HITZ per XLM`);
	console.log(`   Oracle price: ${xlmPerHitz.toFixed(7)} XLM per HITZ`);
	console.log(`   Price impact: ${priceImpact}%`);
	if (quote.rawTrade?.distribution) {
		const protocols = quote.rawTrade.distribution.map((d: any) => d.protocol_id).join(', ');
		console.log(`   Using protocols: ${protocols}`);
	}
	
	return xlmPerHitz;
}

/**
 * Oracle bot: Fetches current market price from Soroswap and updates the contract
 * Uses a representative trade amount (100 XLM) to get accurate market pricing
 * Treasury address is used as oracle updater (no separate oracle key needed)
 */
export async function runOracleBot(env: Env): Promise<OracleRunResult> {
	try {
		if (!env.TREASURY_SEED) {
			return {
				status: 'skipped',
				reason: 'TREASURY_SEED not configured',
			};
		}

		if (!env.SOROSWAP_API_KEY) {
			return {
				status: 'skipped',
				reason: 'SOROSWAP_API_KEY not configured',
			};
		}

		const contract = new ContractClient(env);

		// Fetch current market price from Soroswap API (representative 100 XLM trade)
		const marketPriceXlm = await fetchMarketPriceFromSoroswap(
			env.STELLAR_NETWORK,
			env.SOROSWAP_API_KEY
		);
		const marketPriceStroops = Math.floor(marketPriceXlm * STROOPS);

		// Get current oracle price from contract
		const [currentPriceStroops, lastUpdate] = await contract.getOracleData();
		const currentPriceXlm = Number(currentPriceStroops) / STROOPS;

		// Calculate price change percentage
		const priceChange = Math.abs(marketPriceXlm - currentPriceXlm) / currentPriceXlm;

		// Check if update is needed
		const now = Math.floor(Date.now() / 1000);
		const timeSinceUpdate = now - Number(lastUpdate);

		// Update if:
		// 1. Price changed by more than threshold (0.1%), OR
		// 2. It's been more than 24 hours since last update
		const shouldUpdate = priceChange > PRICE_UPDATE_THRESHOLD || timeSinceUpdate > 86400;

		if (!shouldUpdate) {
			return {
				status: 'skipped',
				reason: `Price change ${(priceChange * 100).toFixed(2)}% below threshold`,
				oldPrice: currentPriceXlm.toFixed(6),
				newPrice: marketPriceXlm.toFixed(6),
			};
		}

		// Don't update too frequently
		if (timeSinceUpdate < UPDATE_INTERVAL) {
			return {
				status: 'skipped',
				reason: `Too soon since last update (${timeSinceUpdate}s < ${UPDATE_INTERVAL}s)`,
			};
		}

		// Update oracle price on contract (use wrapper with auth entry signing)
		await contract.updateOraclePrice(
			env.TREASURY_SEED,
			BigInt(marketPriceStroops)
		);

		console.log(
			`Oracle updated: ${currentPriceXlm.toFixed(6)} → ${marketPriceXlm.toFixed(6)} XLM per HITZ`
		);

		return {
			status: 'updated',
			oldPrice: currentPriceXlm.toFixed(6),
			newPrice: marketPriceXlm.toFixed(6),
			priceChange: `${(priceChange * 100).toFixed(2)}%`,
		};
	} catch (error: any) {
		console.error('❌ ORACLE BOT CRITICAL FAILURE ❌');
		console.error('Error:', error?.message || error);
		console.error('Stack:', error?.stack);
		
		// Re-throw the error to make it visible and stop execution
		// This is critical - we don't want to continue with stale prices
		throw error;
	}
}

