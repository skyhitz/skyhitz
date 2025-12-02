import { AlgoliaClient } from '../algolia/algolia';
import StellarClient from '../stellar/operations';
import ContractClient from '../../contract';
import { Asset, Keypair, Networks, Transaction, TransactionBuilder, Operation, BASE_FEE } from '@stellar/stellar-sdk';
import Encryption from '../util/encryption';

const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
const MAINNET_HORIZON_URL = 'https://horizon.stellar.org';
const STROOPS = 10_000_000;

// Soroban contract addresses for Soroswap
const XLM_CONTRACT_ID = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
const HITZ_CONTRACT_ID = 'CBS5ZVKSSUKF4JY77CKUZPN72EDUM3OOGPYZKFC3KQVONXPJTF6UODD7';

function getNetworkPassphrase(network: string | undefined) {
    return network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
}

function getHorizonUrl(network: string | undefined) {
    return network === 'testnet' ? TESTNET_HORIZON_URL : MAINNET_HORIZON_URL;
}

/**
 * Auto-swap user XLM balances to HITZ via Soroswap
 * 
 * For each user with XLM balance:
 * 1. Check their XLM balance
 * 2. Build Soroswap swap transaction (XLM → HITZ)
 * 3. Execute swap with custodial keys
 * 4. Update Algolia records
 */
export async function swapAllUserXLMToHITZ(env: Env) {
    console.log('🔄 Starting user XLM → HITZ swap via Soroswap');
    console.log('This will auto-swap all custodial user XLM balances to HITZ');
    console.log('');
    
    const algolia = new AlgoliaClient(env);
    const stellar = new StellarClient(env);
    const encryption = new Encryption(env);
    
    // Get all users from Algolia
    console.log('Fetching all users from Algolia...');
    const users = await getAllUsers(algolia);
    
    // Filter to users with custodial accounts and XLM balance
    const usersWithXLM = users.filter(u => {
        return u.seed && u.credits && u.credits > 2; // Only swap if > 2 XLM
    });
    
    console.log(`Found ${usersWithXLM.length} users with XLM balance to swap`);
    console.log('');
    
    let successCount = 0;
    let errorCount = 0;
    let totalXLMSwapped = 0;
    let totalHITZReceived = 0;
    
    for (const user of usersWithXLM) {
        try {
            console.log(`\nProcessing user: ${user.email || user.username} (${user.publicKey})`);
            
            // Check actual on-chain balance
            const { availableCredits } = await stellar.accountCredits(user.publicKey);
            const xlmToSwap = Math.max(0, availableCredits - 2); // Keep 2 XLM for reserves
            
            if (xlmToSwap <= 0.1) {
                console.log(`  Skipping (insufficient balance: ${availableCredits} XLM)`);
                continue;
            }
            
            console.log(`  XLM balance: ${availableCredits.toFixed(2)} XLM`);
            console.log(`  Will swap: ${xlmToSwap.toFixed(2)} XLM (keeping 2 XLM reserve)`);
            
            // Decrypt user's seed
            const userSecret = await encryption.decrypt(user.seed);
            
            // Execute swap via Soroswap
            const hitzReceived = await swapXLMToHITZForUser(
                user.publicKey,
                userSecret,
                xlmToSwap,
                env
            );
            
            console.log(`  ✅ Swapped ${xlmToSwap.toFixed(2)} XLM → ${hitzReceived.toFixed(2)} HITZ`);
            
            // Update Algolia (XLM balance will be ~2, HITZ balance increased)
            await algolia.partialUpdateUser({
                objectID: user.objectID,
                credits: 2, // Reserve kept
            });
            
            successCount++;
            totalXLMSwapped += xlmToSwap;
            totalHITZReceived += hitzReceived;
            
            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`  ❌ Failed to swap for user ${user.email}:`, error);
            errorCount++;
        }
    }
    
    console.log('');
    console.log('✅ User swap complete!');
    console.log(`  Success: ${successCount} users`);
    console.log(`  Errors: ${errorCount} users`);
    console.log(`  Total XLM swapped: ${totalXLMSwapped.toFixed(2)} XLM`);
    console.log(`  Total HITZ received: ${totalHITZReceived.toFixed(2)} HITZ`);
    console.log(`  Average rate: ${(totalHITZReceived / totalXLMSwapped).toFixed(2)} HITZ per XLM`);
    
    return { successCount, errorCount, totalXLMSwapped, totalHITZReceived };
}

/**
 * Swap XLM to HITZ for a single user using Soroswap
 */
async function swapXLMToHITZForUser(
    publicKey: string,
    userSecret: string,
    xlmAmount: number,
    env: Env
): Promise<number> {
    const userKeys = Keypair.fromSecret(userSecret);
    const xlmStroops = BigInt(Math.floor(xlmAmount * STROOPS));
    
    if (!env.SOROSWAP_API_KEY) {
        throw new Error('SOROSWAP_API_KEY not configured');
    }
    
    const networkParam = env.STELLAR_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
    const horizonUrl = getHorizonUrl(env.STELLAR_NETWORK);
    const networkPassphrase = getNetworkPassphrase(env.STELLAR_NETWORK);
    
    // Step 1: Get quote from Soroswap
    const quoteResponse = await fetch(`https://api.soroswap.finance/quote?network=${networkParam}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SOROSWAP_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            assetIn: XLM_CONTRACT_ID,
            assetOut: HITZ_CONTRACT_ID,
            amount: xlmStroops.toString(),
            tradeType: 'EXACT_IN',
            protocols: ['aqua', 'sdex', 'soroswap', 'phoenix'],
            slippageBps: '100', // 1% slippage
            maxHops: 3,
        }),
    });
    
    if (!quoteResponse.ok) {
        const errorText = await quoteResponse.text();
        throw new Error(`Soroswap quote failed: ${errorText}`);
    }
    
    const quote = await quoteResponse.json();
    
    if (!quote || !quote.amountOut) {
        throw new Error('Invalid Soroswap quote response');
    }
    
    const estimatedHitz = Number(quote.amountOut) / STROOPS;
    console.log(`    Quote: ${xlmAmount.toFixed(2)} XLM → ${estimatedHitz.toFixed(2)} HITZ`);
    
    // Step 2: Build transaction via Soroswap
    const buildResponse = await fetch(`https://api.soroswap.finance/quote/build?network=${networkParam}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SOROSWAP_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quote: quote,
            from: publicKey,
            to: publicKey,
        }),
    });
    
    if (!buildResponse.ok) {
        const errorText = await buildResponse.text();
        throw new Error(`Soroswap build failed: ${errorText}`);
    }
    
    const buildResult = await buildResponse.json();
    
    if (!buildResult || !buildResult.xdr) {
        throw new Error('Invalid Soroswap build response');
    }
    
    // Step 3: Sign and submit transaction
    const transaction = new Transaction(buildResult.xdr, networkPassphrase);
    transaction.sign(userKeys);
    
    const submitResponse = await fetch(`${horizonUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `tx=${encodeURIComponent(transaction.toXDR())}`,
    });
    
    if (!submitResponse.ok) {
        const errBody = await submitResponse.text();
        throw new Error(`Swap transaction failed: ${errBody}`);
    }
    
    const result = await submitResponse.json();
    console.log(`    TX Hash: ${result?.hash}`);
    
    return estimatedHitz;
}

/**
 * Helper to get all users from Algolia
 */
async function getAllUsers(algolia: AlgoliaClient): Promise<any[]> {
    const users: any[] = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
        const result = await algolia.usersIndex.search('', {
            page,
            hitsPerPage: 1000,
        });
        
        users.push(...result.hits);
        hasMore = result.nbPages > page + 1;
        page++;
    }
    
    return users;
}

/**
 * CLI entry point
 */
if (require.main === module) {
    console.log('Run this script via your backend deployment system with proper Env configuration');
    console.log('Example: await swapAllUserXLMToHITZ(env);');
}

