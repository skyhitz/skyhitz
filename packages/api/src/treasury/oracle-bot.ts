import ContractClient from '../../contract';

const PRICE_UPDATE_THRESHOLD = 0.001; // 0.1% change triggers update (more sensitive to price changes)
const UPDATE_INTERVAL = 3600; // 1 hour minimum between updates
const MAINNET_HORIZON_URL = 'https://horizon.stellar.org';
const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';

interface OracleRunResult {
	status: 'updated' | 'skipped';
	reason?: string;
	oldPrice?: string;
	newPrice?: string;
	priceChange?: string;
}

function getHorizonUrl(network: string | undefined) {
	return network === 'testnet' ? TESTNET_HORIZON_URL : MAINNET_HORIZON_URL;
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
 * Fetch current HITZ/XLM market price from Stellar Expert API
 * Converts USD prices to XLM-denominated price
 * 
 * CRITICAL: This function throws on any error - no fallbacks!
 * Fallback prices could result in massive losses if oracle is set incorrectly.
 */
async function fetchMarketPrice(hitzIssuer: string): Promise<number> {
	// Fetch HITZ price in USD
	const hitzUrl = `https://api.stellar.expert/explorer/public/asset/HITZ-${hitzIssuer}`;
	console.log(`Fetching HITZ price from: ${hitzUrl}`);
	const hitzData = await fetchJson<{ price: number }>(hitzUrl);
	const hitzPriceUsd = hitzData.price;

	if (!hitzPriceUsd || hitzPriceUsd <= 0 || !Number.isFinite(hitzPriceUsd)) {
		throw new Error(`Invalid HITZ USD price from Stellar Expert: ${hitzPriceUsd}`);
	}

	// Fetch XLM price in USD
	const xlmUrl = 'https://api.stellar.expert/explorer/public/asset/XLM';
	console.log(`Fetching XLM price from: ${xlmUrl}`);
	const xlmData = await fetchJson<{ price: number }>(xlmUrl);
	const xlmPriceUsd = xlmData.price;

	if (!xlmPriceUsd || xlmPriceUsd <= 0 || !Number.isFinite(xlmPriceUsd)) {
		throw new Error(`Invalid XLM USD price from Stellar Expert: ${xlmPriceUsd}`);
	}

	// Calculate HITZ price in XLM: HITZ_USD / XLM_USD
	// Example: HITZ = $0.064, XLM = $0.318 → 0.064/0.318 = 0.201 XLM per HITZ
	const hitzPriceXlm = hitzPriceUsd / xlmPriceUsd;

	if (!Number.isFinite(hitzPriceXlm) || hitzPriceXlm <= 0) {
		throw new Error(`Invalid calculated HITZ/XLM price: ${hitzPriceXlm} (HITZ: $${hitzPriceUsd}, XLM: $${xlmPriceUsd})`);
	}

	console.log(`Oracle Stellar Expert API:`);
	console.log(`  HITZ: $${hitzPriceUsd.toFixed(6)} USD`);
	console.log(`  XLM: $${xlmPriceUsd.toFixed(6)} USD`);
	console.log(`  HITZ price: ${hitzPriceXlm.toFixed(7)} XLM per HITZ`);

	return hitzPriceXlm;
}

/**
 * Oracle bot: Fetches current market price and updates the contract
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

		const contract = new ContractClient(env);

		// Get HITZ asset info
		const hitzIssuer = env.ISSUER_ID;

		if (!hitzIssuer) {
			return {
				status: 'skipped',
				reason: 'ISSUER_ID not configured',
			};
		}

		// Fetch current market price from Stellar Expert API
		const marketPriceXlm = await fetchMarketPrice(hitzIssuer);
		const marketPriceStroops = Math.floor(marketPriceXlm * 10_000_000);

		// Get current oracle price from contract
		const [currentPriceStroops, lastUpdate] = await contract.getOracleData();
		const currentPriceXlm = Number(currentPriceStroops) / 10_000_000;

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

