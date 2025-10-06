import { Asset, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, Account } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';

const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const MAINNET_HORIZON_URL = 'https://horizon.stellar.org';
const DEFAULT_PRICE = 0.01; // 0.01 XLM per HITZ
const DEFAULT_BUFFER = 1; // Keep 1 XLM buffer by default
const STROOPS = 10_000_000;

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

async function fetchOffers(horizonUrl: string, accountId: string, hitzCode: string, hitzIssuer: string) {
    const offers: any[] = [];
    let next: string | undefined = `${horizonUrl}/accounts/${accountId}/offers?limit=200`;
    while (next) {
        const page: any = await fetchJson(next);
        const records: any[] = Array.isArray(page?.records) ? page.records : [];
        for (const record of records) {
            if (
                record.selling?.asset_type === 'native' &&
                record.buying?.asset_code === hitzCode &&
                record.buying?.asset_issuer === hitzIssuer
            ) {
                offers.push(record);
            }
        }
        if (!page?._links?.next?.href || !records.length) {
            break;
        }
        next = page._links.next.href;
    }
    return offers;
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
		ensureEnv(env, 'TREASURY_SEED');
		ensureEnv(env, 'ISSUER_ID');
		const treasuryKeys = Keypair.fromSecret(env.TREASURY_SEED as string);
		const networkPassphrase = getNetworkPassphrase(env.STELLAR_NETWORK);
		const horizonUrl = getHorizonUrl(env.STELLAR_NETWORK);
		const hitzAssetCode = await resolveHitzSymbol(env);
		const hitzAsset = new Asset(hitzAssetCode, env.ISSUER_ID);
		// Derive dynamic price from order book: follow market up and down; fallback to anchor if empty
		let price = DEFAULT_PRICE;
        try {
            const params = new URLSearchParams({
                selling_asset_type: 'credit_alphanum4',
                selling_asset_code: hitzAssetCode,
                selling_asset_issuer: env.ISSUER_ID,
                buying_asset_type: 'native',
            });
			const data: any = await fetchJson(`${horizonUrl}/order_book?${params.toString()}`);
			const bestAskStr = data?.asks?.[0]?.price;
			const bestAsk = Number.parseFloat(bestAskStr);
			if (Number.isFinite(bestAsk) && bestAsk > 0) {
				price = bestAsk;
			}
        } catch (_) {}
		const buffer = DEFAULT_BUFFER;

        const account: AccountData = await fetchJson(`${horizonUrl}/accounts/${treasuryKeys.publicKey()}`);
        const nativeBalance = (account.balances || []).find((b: any) => b.asset_type === 'native');
		if (!nativeBalance) {
			throw new Error('Treasury account has no XLM balance');
		}
        const totalXlm = parseFloat((nativeBalance as any).balance);
        const minBalance = computeMinBalance(account) + buffer;
		const spendable = totalXlm - minBalance;
		if (spendable <= price) {
			return { status: 'skipped', reason: 'Insufficient spendable XLM' };
		}
		const buyAmount = Math.max(0, spendable / price);
		const buyAmountFormatted = toStellarAmount(buyAmount);
		if (parseFloat(buyAmountFormatted) <= 0) {
			return { status: 'skipped', reason: 'Rounded buy amount is zero' };
		}

        const hasTrustline = (account.balances || []).some(
            (b: any) => b.asset_code === hitzAssetCode && b.asset_issuer === env.ISSUER_ID
        );
        const offers = await fetchOffers(horizonUrl, treasuryKeys.publicKey(), hitzAssetCode, env.ISSUER_ID);

        const operations: any[] = [];
		if (!hasTrustline) {
			operations.push(
				Operation.changeTrust({
					asset: hitzAsset,
				})
			);
		}
		for (const offer of offers) {
			operations.push(
				Operation.manageBuyOffer({
					selling: Asset.native(),
					buying: hitzAsset,
                    buyAmount: '0', // delete previous buy wall orders
                    price: price.toFixed(7),
                    offerId: offer.id,
				})
			);
		}
		operations.push(
			Operation.manageBuyOffer({
				selling: Asset.native(),
				buying: hitzAsset,
				buyAmount: buyAmountFormatted,
				price: price.toFixed(7),
			})
		);

		const baseFee = Number.parseInt(typeof BASE_FEE === 'string' ? BASE_FEE : `${BASE_FEE}`, 10) || 100;
        const builder = new TransactionBuilder(new Account(account.id, account.sequence), {
			fee: (baseFee * Math.max(operations.length, 1)).toString(),
			networkPassphrase,
		});
		operations.forEach((op) => builder.addOperation(op));
		const transaction = builder.setTimeout(0).build();
		transaction.sign(treasuryKeys);

		const xdr = transaction.toXDR();
        const response = await fetch(`${horizonUrl}/transactions?tx=${encodeURIComponent(xdr)}`, { method: 'POST' });
		if (!response.ok) {
			const errBody = await response.text();
			throw new Error(`submitTransaction failed (${response.status}): ${errBody}`);
		}
        const result: any = await response.json();
        const spendAmount = toStellarAmount(parseFloat(buyAmountFormatted) * price);

        // After buy, distribute HITZ on Soroban using Treasury as caller
        try {
            const contract = new ContractClient(env);
            // Read Treasury's HITZ balance before and after to compute delta; fallback to buyAmountFormatted
            const treasuryAddress = treasuryKeys.publicKey();
            const beforeBalance = await contract.getHitzBalance(treasuryAddress);
            // Small delay to allow offer settlement to reflect in balance endpoints
            await new Promise((r) => setTimeout(r, 500));
            const afterBalance = await contract.getHitzBalance(treasuryAddress);
            const delta = Math.max(0, Number(afterBalance) - Number(beforeBalance));
            const hitzAmountStroops = BigInt(
                delta > 0 ? delta : Math.floor(parseFloat(buyAmountFormatted) * 10_000_000)
            );

            if (hitzAmountStroops > 0n) {
                // Build and sign distribute call with Treasury keys
                const treasurySignedClient = contract.getClientForKeypair(treasuryKeys);
                const distTx = await treasurySignedClient.distribute_rewards(
                    { caller: treasuryAddress, hitz_amount: hitzAmountStroops },
                    { timeoutInSeconds: 60 }
                );
                await distTx.signAndSend();
            }
        } catch (e) {
            console.log('treasury-bot: distribute_rewards skipped', (e as any)?.message || e);
        }

        return {
            status: 'submitted',
            txHash: result?.hash,
            buyAmount: buyAmountFormatted,
            spendAmount,
        };
	} catch (error: any) {
		console.error('Treasury bot failed:', error?.message || error);
		return {
			status: 'skipped',
			reason: error?.message || 'Unknown error',
		};
	}
}

