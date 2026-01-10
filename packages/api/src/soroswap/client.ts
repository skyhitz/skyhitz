import { Keypair, Networks, Transaction } from '@stellar/stellar-sdk';
import { STROOPS, XLM_CONTRACT_ID, HITZ_CONTRACT_ID, getHorizonUrl } from '../constants/stellar';

const SOROSWAP_API_URL = 'https://api.soroswap.finance';

function getNetworkPassphrase(network: string | undefined) {
	return network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
}

export interface SoroswapQuote {
	amountOut: string;
	rawTrade?: any;
	priceImpactPct?: string;
	[key: string]: any;
}

export interface SwapResult {
	txHash: string;
	xlmAmount: number;
	hitzAmount: number;
}

/**
 * Soroswap DEX aggregator client for XLM ↔ HITZ swaps
 */
export class SoroswapClient {
	private apiKey: string;
	private network: string;
	private networkPassphrase: string;
	private horizonUrl: string;

	constructor(env: Env) {
		if (!env.SOROSWAP_API_KEY) {
			throw new Error('SOROSWAP_API_KEY not configured');
		}
		this.apiKey = env.SOROSWAP_API_KEY;
		this.network = env.STELLAR_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
		this.networkPassphrase = getNetworkPassphrase(env.STELLAR_NETWORK);
		this.horizonUrl = getHorizonUrl(env.STELLAR_NETWORK);
	}

	/**
	 * Get a swap quote from Soroswap
	 */
	async getQuote(xlmAmount: number): Promise<SoroswapQuote> {
		const xlmStroops = BigInt(Math.floor(xlmAmount * STROOPS));

		const requestBody = {
			assetIn: XLM_CONTRACT_ID,
			assetOut: HITZ_CONTRACT_ID,
			amount: xlmStroops.toString(),
			tradeType: 'EXACT_IN',
			protocols: ['aqua', 'sdex', 'soroswap', 'phoenix'],
			slippageBps: '100', // 1% slippage
			maxHops: 3,
		};

		console.log(`🔍 Soroswap quote request (XLM→HITZ):`);
		console.log(`   XLM Amount: ${xlmAmount}`);
		console.log(`   Network: ${this.network}`);
		console.log(`   Request:`, JSON.stringify(requestBody));

		const response = await fetch(`${SOROSWAP_API_URL}/quote?network=${this.network}`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`❌ Soroswap quote failed:`);
			console.error(`   Status: ${response.status}`);
			console.error(`   Response: ${errorText}`);
			throw new Error(`Soroswap quote failed (${response.status}): ${errorText}`);
		}

		const quote: any = await response.json();

		if (!quote || !quote.amountOut) {
			throw new Error(`Invalid Soroswap quote response: ${JSON.stringify(quote).substring(0, 200)}`);
		}

		return quote;
	}

	/**
	 * Build a swap transaction from a quote
	 */
	async buildTransaction(quote: SoroswapQuote, fromAddress: string, toAddress?: string): Promise<string> {
		const response = await fetch(`${SOROSWAP_API_URL}/quote/build?network=${this.network}`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${this.apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				quote: quote,
				from: fromAddress,
				to: toAddress || fromAddress,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Soroswap build failed (${response.status}): ${errorText}`);
		}

		const result: any = await response.json();

		if (!result || !result.xdr || typeof result.xdr !== 'string') {
			throw new Error(`Invalid Soroswap build response: ${JSON.stringify(result).substring(0, 200)}`);
		}

		return result.xdr;
	}

	/**
	 * Sign and submit a transaction to Horizon
	 */
	async signAndSubmit(xdr: string, signerSecret: string): Promise<string> {
		const signerKeys = Keypair.fromSecret(signerSecret);
		const transaction = new Transaction(xdr, this.networkPassphrase);
		transaction.sign(signerKeys);

		const response = await fetch(`${this.horizonUrl}/transactions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: `tx=${encodeURIComponent(transaction.toXDR())}`,
		});

		if (!response.ok) {
			const errBody = await response.text();
			throw new Error(`Transaction submission failed: ${errBody}`);
		}

		const result: any = await response.json();
		return result?.hash || '';
	}

	/**
	 * Execute a complete XLM → HITZ swap
	 * 
	 * @param xlmAmount - Amount of XLM to swap
	 * @param signerSecret - Secret key of the account executing the swap
	 * @param signerPublicKey - Public key of the signer (optional, derived if not provided)
	 * @returns SwapResult with transaction hash and amounts
	 */
	async swapXLMToHITZ(
		xlmAmount: number,
		signerSecret: string,
		signerPublicKey?: string
	): Promise<SwapResult> {
		const publicKey = signerPublicKey || Keypair.fromSecret(signerSecret).publicKey();

		// Step 1: Get quote
		const quote = await this.getQuote(xlmAmount);
		const hitzAmount = Number(quote.amountOut) / STROOPS;
		
		console.log(`Soroswap quote: ${xlmAmount.toFixed(2)} XLM → ${hitzAmount.toFixed(2)} HITZ`);

		// Step 2: Build transaction
		const xdr = await this.buildTransaction(quote, publicKey);

		// Step 3: Sign and submit
		const txHash = await this.signAndSubmit(xdr, signerSecret);
		
		console.log(`Soroswap swap TX: ${txHash}`);

		return { txHash, xlmAmount, hitzAmount };
	}

	/**
	 * Get estimated HITZ output for a given XLM amount (quote only, no execution)
	 */
	async getEstimatedHITZ(xlmAmount: number): Promise<number> {
		const quote = await this.getQuote(xlmAmount);
		return Number(quote.amountOut) / STROOPS;
	}
}

export default SoroswapClient;

