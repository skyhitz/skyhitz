import { Asset, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder, Account } from '@stellar/stellar-sdk';
import ContractClient from '../../contract';
import { runOracleBot } from './oracle-bot';
import { syncAllAPRsToAlgolia } from './sync-aprs';

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
    console.log('Fetching offers from:', next);
    while (next) {
        const page: any = await fetchJson(next);
        console.log('Page response structure:', JSON.stringify(page, null, 2).substring(0, 500));
        
        // Check both possible response structures
        const records: any[] = Array.isArray(page?.records) 
            ? page.records 
            : Array.isArray(page?._embedded?.records)
            ? page._embedded.records
            : [];
        
        console.log(`Received ${records.length} total offers from API`);
        
        for (const record of records) {
            console.log(`Offer ${record.id}: selling ${record.selling?.asset_type || record.selling?.asset_code} for ${record.buying?.asset_type || record.buying?.asset_code}`);
            
            if (
                record.selling?.asset_type === 'native' &&
                record.buying?.asset_code === hitzCode &&
                record.buying?.asset_issuer === hitzIssuer
            ) {
                console.log(`  ✓ Matched HITZ buy offer`);
                offers.push(record);
            } else {
                console.log(`  ✗ Not matched (selling: ${record.selling?.asset_type || record.selling?.asset_code}, buying: ${record.buying?.asset_type || record.buying?.asset_code})`);
            }
        }
        if (!page?._links?.next?.href || !records.length) {
            break;
        }
        next = page._links.next.href;
    }
    console.log(`Total matching HITZ buy offers: ${offers.length}`);
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
		console.log('=== TREASURY BOT STARTING ===');
		console.log('Timestamp:', new Date().toISOString());
		
		// Step 1: Update oracle price first (treasury bot will use this for dynamic emission)
		const oracleResult = await runOracleBot(env);
		console.log('Oracle bot result:', oracleResult);
		
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
		// Derive dynamic price from order book: follow market up and down; fallback to anchor if empty
		// Note: We need the price in XLM per HITZ for calculating buy amounts
		let priceXlmPerHitz = DEFAULT_PRICE;
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
				priceXlmPerHitz = bestAsk;
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

	// Check if trustline exists and count existing offers BEFORE calculating spendable
	// This ensures we account for transaction fees in our spendable calculation
        const hasTrustline = (account.balances || []).some(
            (b: any) => b.asset_code === hitzAssetCode && b.asset_issuer === env.ISSUER_ID
        );
        console.log(`Looking for offers: selling XLM, buying ${hitzAssetCode}:${env.ISSUER_ID}`);
        const offers = await fetchOffers(horizonUrl, treasuryKeys.publicKey(), hitzAssetCode, env.ISSUER_ID);
	console.log(`Found ${offers.length} existing offers to cancel`);
	
	// If no offers found, fetch all offers to debug
	if (offers.length === 0) {
		console.log('⚠️ No HITZ buy offers found. Fetching ALL offers for debugging...');
		try {
			const allOffersResponse: any = await fetchJson(`${horizonUrl}/accounts/${treasuryKeys.publicKey()}/offers?limit=200`);
			const allOffers = allOffersResponse?._embedded?.records || allOffersResponse?.records || [];
			console.log(`Total offers on account: ${allOffers.length}`);
			allOffers.forEach((offer: any) => {
				console.log(`  - Offer ${offer.id}:`);
				console.log(`    Selling: ${offer.selling?.asset_type === 'native' ? 'XLM' : `${offer.selling?.asset_code}:${offer.selling?.asset_issuer}`}`);
				console.log(`    Buying: ${offer.buying?.asset_type === 'native' ? 'XLM' : `${offer.buying?.asset_code}:${offer.buying?.asset_issuer}`}`);
				console.log(`    Amount: ${offer.amount}, Price: ${offer.price}`);
			});
		} catch (e) {
			console.error('Failed to fetch all offers for debugging:', e);
		}
	}
	
	// Calculate total XLM locked in existing offers
	// Each offer has 'amount' (XLM selling) that's currently locked
	const lockedXlm = offers.reduce((sum, offer) => {
		const amount = parseFloat(offer.amount || '0');
		console.log(`  Offer ID ${offer.id}: ${amount.toFixed(2)} XLM at price ${offer.price}`);
		return sum + amount;
	}, 0);
	console.log(`XLM locked in existing offers: ${lockedXlm.toFixed(2)} XLM`);

	// Calculate how many operations we'll need for the transaction
	const baseFee = Number.parseInt(typeof BASE_FEE === 'string' ? BASE_FEE : `${BASE_FEE}`, 10) || 100;
	let numOperations = 1; // Always at least 1 (create new offer)
	if (!hasTrustline) {
		numOperations++; // Add trustline operation
	}
	numOperations += offers.length; // Add operations to delete old offers
	
	// Calculate total transaction fee in XLM (fee is in stroops, convert to XLM)
	const transactionFeeXlm = (baseFee * numOperations) / 10_000_000;
	
	// Add a small extra buffer for transaction fee variance (0.01 XLM)
	const feeBuffer = 0.01;
	
	// Calculate available XLM (excluding locked in offers)
	const availableXlm = totalXlm - lockedXlm;
	
	// IMPORTANT: Stellar validates the ENTIRE transaction before executing any operations
	// This means when validating the new offer, the old offer is still locked!
	// So we can only use the currently available XLM for the new offer.
	// 
	// CRITICAL: Creating an offer adds a NEW SUBENTRY, which increases min balance by 0.5 XLM!
	// We need to account for this in our calculation.
	const newOfferSubentryReserve = 0.5; // Creating an offer adds 1 subentry = 0.5 XLM reserve
	
	// Calculate spendable amount for NEW offer (using only available XLM)
	// The cancel operation will execute first, but validation happens before execution
	const spendable = availableXlm - minBalance - newOfferSubentryReserve - transactionFeeXlm - feeBuffer;
	
	console.log(`Treasury balance: ${totalXlm.toFixed(2)} XLM (${lockedXlm.toFixed(2)} locked in offers, ${availableXlm.toFixed(2)} available)`);
	console.log(`Min reserve: ${minBalance.toFixed(2)} XLM, new offer subentry: ${newOfferSubentryReserve} XLM, tx fee: ${transactionFeeXlm.toFixed(7)} XLM (${numOperations} ops), fee buffer: ${feeBuffer} XLM`);
	console.log(`Spendable for new offer (using only available XLM): ${spendable.toFixed(7)} XLM`);
	console.log(`Current price: ${priceXlmPerHitz.toFixed(7)} XLM per HITZ`);
	
	if (lockedXlm > 0) {
		console.log(`⚠️ Note: ${lockedXlm.toFixed(2)} XLM is locked in existing offers and can't be used for the new offer in this transaction.`);
		console.log(`   The old offer will be cancelled, but Stellar validates all operations before executing any.`);
		console.log(`   Next bot run will use the full balance (~${(totalXlm - minBalance - transactionFeeXlm - feeBuffer).toFixed(2)} XLM).`);
	}
	
	if (spendable <= priceXlmPerHitz) {
		console.log('❌ SKIPPING: Insufficient spendable XLM');
		return { status: 'skipped', reason: `Insufficient spendable XLM (${spendable.toFixed(2)} XLM available, ${priceXlmPerHitz.toFixed(2)} XLM minimum)` };
	}
	// For manageBuyOffer, price = how much BUYING asset per 1 SELLING asset
	// We're selling XLM, buying HITZ, so price = HITZ per XLM = 1 / priceXlmPerHitz
	const offerPrice = 1 / priceXlmPerHitz;
	const offerPriceFormatted = offerPrice.toFixed(7);
	
	// Use manageSellOffer instead of manageBuyOffer to avoid underfunding issues
	// With manageSellOffer, we specify EXACTLY how much XLM to sell
	// This eliminates ambiguity and Stellar's internal calculations
	const sellAmount = toStellarAmount(spendable); // Exactly how much XLM we'll sell
	const expectedBuyAmount = parseFloat(sellAmount) * offerPrice; // How much HITZ we expect to get
	
	const newMinBalanceAfterOffer = minBalance + newOfferSubentryReserve; // Min balance AFTER creating the offer
	console.log(`Will sell ${sellAmount} XLM to buy ~${expectedBuyAmount.toFixed(2)} HITZ`);
	console.log(`Offer price: ${offerPriceFormatted} HITZ per XLM (market: ${(1/priceXlmPerHitz).toFixed(2)} HITZ/XLM)`);
	console.log(`Stellar validation: XLM sold (${sellAmount}) + NEW min balance (${newMinBalanceAfterOffer.toFixed(7)}) + tx fee (${transactionFeeXlm.toFixed(7)}) = ${(parseFloat(sellAmount) + newMinBalanceAfterOffer + transactionFeeXlm).toFixed(7)} <= ${totalXlm.toFixed(7)} available`);
	
	if (parseFloat(sellAmount) <= 0) {
		console.log('❌ SKIPPING: Sell amount is zero');
		return { status: 'skipped', reason: 'Sell amount is zero' };
	}

		// If there are existing offers, we need TWO separate transactions:
		// 1. Cancel old offers (frees up locked XLM)
		// 2. Create new offer with full balance (after cancellation confirms)
		// This avoids Stellar validation issues with overlapping liabilities
		if (offers.length > 0) {
			console.log(`⚠️ Strategy: Two-transaction approach to avoid validation overlap`);
			console.log(`   Transaction 1: Cancel ${offers.length} existing offers (${lockedXlm.toFixed(2)} XLM)`);
			console.log(`   Transaction 2: Create new offer with full balance (~${(totalXlm - minBalance - transactionFeeXlm - feeBuffer).toFixed(2)} XLM)`);
			
			// === TRANSACTION 1: Cancel existing offers ===
			const cancelOps: any[] = [];
			if (!hasTrustline) {
				console.log('Adding trustline operation to cancellation tx');
				cancelOps.push(
					Operation.changeTrust({
						asset: hitzAsset,
					})
				);
			}
			
			for (const offer of offers) {
				console.log(`Cancelling offer ID: ${offer.id} (${offer.amount} XLM)`);
				cancelOps.push(
					Operation.manageSellOffer({
						selling: Asset.native(),
						buying: hitzAsset,
						amount: '0',
						price: offerPriceFormatted,
						offerId: offer.id,
					})
				);
			}
			
			console.log(`Submitting cancellation transaction with ${cancelOps.length} operations...`);
			const cancelBuilder = new TransactionBuilder(new Account(account.id, account.sequence), {
				fee: (baseFee * cancelOps.length).toString(),
				networkPassphrase,
			});
			cancelOps.forEach((op) => cancelBuilder.addOperation(op));
			const cancelTx = cancelBuilder.setTimeout(0).build();
			cancelTx.sign(treasuryKeys);
			
			const cancelXdr = cancelTx.toXDR();
			const cancelResponse = await fetch(`${horizonUrl}/transactions?tx=${encodeURIComponent(cancelXdr)}`, { method: 'POST' });
			if (!cancelResponse.ok) {
				const errBody = await cancelResponse.text();
				console.error('❌ Cancellation transaction failed:', errBody);
				throw new Error(`Cancel transaction failed (${cancelResponse.status}): ${errBody}`);
			}
			const cancelResult: any = await cancelResponse.json();
			console.log('✅ Cancellation successful! Hash:', cancelResult?.hash);
			console.log(`   Freed ${lockedXlm.toFixed(2)} XLM from old offers`);
			
			// === TRANSACTION 2: Create new offer with full balance ===
			console.log('Fetching updated account state...');
			const updatedAccount: AccountData = await fetchJson(`${horizonUrl}/accounts/${treasuryKeys.publicKey()}`);
			const updatedNativeBalance = (updatedAccount.balances || []).find((b: any) => b.asset_type === 'native');
			const updatedTotalXlm = parseFloat((updatedNativeBalance as any).balance);
			const updatedMinBalance = computeMinBalance(updatedAccount) + buffer;
			
			// Recalculate spendable with new sequence and no locked offers
			const numOpsForNewOffer = 1; // Just the create offer operation
			const newOfferTxFee = (baseFee * numOpsForNewOffer) / 10_000_000;
			const newOfferSubentryReserve2 = 0.5; // Creating offer adds subentry
			const newSpendable = updatedTotalXlm - updatedMinBalance - newOfferSubentryReserve2 - newOfferTxFee - feeBuffer;
			const newSellAmount = toStellarAmount(newSpendable); // Exact XLM to sell
			const newExpectedBuy = parseFloat(newSellAmount) * offerPrice;
			
			console.log(`Updated balance: ${updatedTotalXlm.toFixed(2)} XLM (all available, no locked)`);
			console.log(`Creating new offer: selling ${newSellAmount} XLM at ${offerPriceFormatted} HITZ per XLM to buy ~${newExpectedBuy.toFixed(2)} HITZ`);
			
			const createOps = [
				Operation.manageSellOffer({
					selling: Asset.native(),
					buying: hitzAsset,
					amount: newSellAmount, // Exact XLM amount
					price: offerPriceFormatted,
				})
			];
			
			console.log(`Submitting creation transaction with ${createOps.length} operations...`);
			const createBuilder = new TransactionBuilder(new Account(updatedAccount.id, updatedAccount.sequence), {
				fee: (baseFee * createOps.length).toString(),
				networkPassphrase,
			});
			createOps.forEach((op) => createBuilder.addOperation(op));
			const createTx = createBuilder.setTimeout(0).build();
			createTx.sign(treasuryKeys);
			
			const createXdr = createTx.toXDR();
			const createResponse = await fetch(`${horizonUrl}/transactions?tx=${encodeURIComponent(createXdr)}`, { method: 'POST' });
			if (!createResponse.ok) {
				const errBody = await createResponse.text();
				console.error('❌ Creation transaction failed:', errBody);
				throw new Error(`Create transaction failed (${createResponse.status}): ${errBody}`);
			}
			const createResult: any = await createResponse.json();
			console.log('✅ Creation successful! Hash:', createResult?.hash);
			
			console.log('=== TREASURY BOT COMPLETED SUCCESSFULLY ===');
			console.log(`Cancelled old offers and created new offer selling ${newSellAmount} XLM for ~${newExpectedBuy.toFixed(2)} HITZ`);
			
			return {
				status: 'submitted',
				txHash: createResult?.hash,
				buyAmount: newExpectedBuy.toFixed(7),
				spendAmount: newSellAmount,
			};
		} else {
			// No existing offers, create new one with all available balance (single transaction)
			// Use manageSellOffer to specify EXACT XLM amount (avoids underfunding issues)
			console.log(`Creating new offer: selling ${sellAmount} XLM at ${offerPriceFormatted} HITZ per XLM to buy ~${expectedBuyAmount.toFixed(2)} HITZ`);
			
			const operations: any[] = [];
			if (!hasTrustline) {
				console.log('Adding trustline operation');
				operations.push(
					Operation.changeTrust({
						asset: hitzAsset,
					})
				);
			}
			operations.push(
				Operation.manageSellOffer({
					selling: Asset.native(),
					buying: hitzAsset,
					amount: sellAmount, // Exact XLM amount to sell
					price: offerPriceFormatted,
				})
			);
			
			console.log(`Submitting transaction with ${operations.length} operations...`);
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
				console.error('❌ Transaction submission failed:', errBody);
				throw new Error(`submitTransaction failed (${response.status}): ${errBody}`);
			}
			const result: any = await response.json();
			console.log('✅ Transaction successful! Hash:', result?.hash);
			
			console.log('=== TREASURY BOT COMPLETED SUCCESSFULLY ===');
			
			return {
				status: 'submitted',
				txHash: result?.hash,
				buyAmount: expectedBuyAmount.toFixed(7),
				spendAmount: sellAmount,
			};
		}
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

