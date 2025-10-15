import { Keypair } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';

const PRICE_UPDATE_THRESHOLD = 0.01; // 5% change triggers update
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
 * Fetch current HITZ/XLM market price from Stellar DEX
 */
async function fetchDexPrice(horizonUrl: string, hitzCode: string, hitzIssuer: string): Promise<number> {
	try {
		const params = new URLSearchParams({
			selling_asset_type: 'credit_alphanum4',
			selling_asset_code: hitzCode,
			selling_asset_issuer: hitzIssuer,
			buying_asset_type: 'native',
		});

		const response = await fetchJson(`${horizonUrl}/order_book?${params.toString()}`);

		// Get best ask price (what it costs to buy HITZ with XLM)
		const bestAsk = parseFloat(response?.asks?.[0]?.price);

		if (Number.isFinite(bestAsk) && bestAsk > 0) {
			return bestAsk;
		}

		// Fallback: Check recent trades
		const tradesUrl = `${horizonUrl}/trades?${params.toString()}&limit=10`;
		const tradesResponse = await fetchJson(tradesUrl);

		if (tradesResponse?._embedded?.records?.length > 0) {
			// Average recent trade prices
			const prices = tradesResponse._embedded.records
				.map((t: any) => parseFloat(t.price))
				.filter((p: number) => Number.isFinite(p) && p > 0);

			if (prices.length > 0) {
				return prices.reduce((a: number, b: number) => a + b) / prices.length;
			}
		}

		return 0.01; // Default fallback
	} catch (error) {
		console.error('Failed to fetch DEX price:', error);
		return 0.01;
	}
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

		const treasuryKeys = Keypair.fromSecret(env.TREASURY_SEED);
		const contract = new ContractClient(env);
		const horizonUrl = getHorizonUrl(env.STELLAR_NETWORK);

		// Get HITZ asset info
		const hitzCode = (await contract.getHitzSymbol()) || 'HITZ';
		const hitzIssuer = env.ISSUER_ID;

		if (!hitzIssuer) {
			return {
				status: 'skipped',
				reason: 'ISSUER_ID not configured',
			};
		}

		// Fetch current market price from DEX
		const marketPriceXlm = await fetchDexPrice(horizonUrl, hitzCode, hitzIssuer);
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
		// 1. Price changed by more than threshold (5%), OR
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
		console.error('Oracle bot failed:', error);
		return {
			status: 'skipped',
			reason: error?.message || 'Unknown error',
		};
	}
}

