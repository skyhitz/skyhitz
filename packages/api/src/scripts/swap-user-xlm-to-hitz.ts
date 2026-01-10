import { AlgoliaClient } from '../algolia/algolia';
import StellarClient from '../stellar/operations';
import Encryption from '../util/encryption';
import SoroswapClient from '../soroswap/client';

		
		// Manual trigger to swap user XLM balances to HITZ (one-time migration) add this to /api/src/index.ts
		// Processes 100 users per request. Call multiple times with ?offset=X to continue.
		// Comment out this block when not needed.
		// if (request.method === 'POST' && new URL(request.url).pathname === '/swap-xlm-to-hitz') {
		// 	const url = new URL(request.url);
		// 	const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
			
		// 	try {
		// 		const result = await swapAllUserXLMToHITZ(env, offset);
		// 		return new Response(JSON.stringify(result, null, 2), {
		// 			status: 200,
		// 			headers: { 'Content-Type': 'application/json' },
		// 		});
		// 	} catch (error: any) {
		// 		return new Response(JSON.stringify({ 
		// 			error: error?.message || 'Unknown error',
		// 			stack: error?.stack 
		// 		}, null, 2), {
		// 			status: 500,
		// 			headers: { 'Content-Type': 'application/json' },
		// 		});
		// 	}
		// }
		

// Default batch size - processes this many users per request
const DEFAULT_BATCH_SIZE = 100;

export interface SwapResult {
    successCount: number;
    skippedCount: number;
    errorCount: number;
    totalXLMSwapped: number;
    totalHITZReceived: number;
    totalUsers: number;
    processedUsers: number;
    nextOffset: number | null;
    details: Array<{
        email: string;
        publicKey: string;
        status: 'success' | 'skipped' | 'error';
        xlmSwapped?: number;
        hitzReceived?: number;
        error?: string;
    }>;
}

/**
 * Auto-swap user XLM balances to HITZ via Soroswap
 * 
 * For each user with XLM balance:
 * 1. Check their XLM balance
 * 2. Ensure HITZ trustline exists
 * 3. Build Soroswap swap transaction (XLM → HITZ)
 * 4. Execute swap with custodial keys
 * 
 * Processes users in batches to avoid Cloudflare Worker timeouts.
 * Call with ?offset=X to continue from where it left off.
 * 
 * Trigger via POST /swap-xlm-to-hitz?offset=0
 */
export async function swapAllUserXLMToHITZ(env: Env, offset: number = 0): Promise<SwapResult> {
    console.log('🔄 Starting user XLM → HITZ swap via Soroswap');
    console.log(`Processing batch: offset=${offset}, limit=${DEFAULT_BATCH_SIZE}`);
    console.log('');
    
    const algolia = new AlgoliaClient(env);
    const stellar = new StellarClient(env);
    const encryption = new Encryption(env);
    
    // Get all users from Algolia
    console.log('Fetching all users from Algolia...');
    const users = await algolia.getAllUsers();
    
    // Filter to users with custodial accounts (those with encrypted seeds)
    const usersWithCustodialAccounts = users.filter(u => u.seed && u.publicKey);
    const totalUsers = usersWithCustodialAccounts.length;
    
    console.log(`Found ${totalUsers} users with custodial accounts`);
    console.log(`Processing users ${offset + 1} to ${Math.min(offset + DEFAULT_BATCH_SIZE, totalUsers)}`);
    console.log('');
    
    // Process only a batch of users starting from offset
    const batch = usersWithCustodialAccounts.slice(offset, offset + DEFAULT_BATCH_SIZE);
    const processedUsers = offset + batch.length;
    const hasMore = processedUsers < totalUsers;
    
    const result: SwapResult = {
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        totalXLMSwapped: 0,
        totalHITZReceived: 0,
        totalUsers,
        processedUsers,
        nextOffset: hasMore ? processedUsers : null,
        details: [],
    };
    
    if (batch.length === 0) {
        console.log('⚠️  No users to process in this batch');
        return result;
    }
    
    for (const user of batch) {
        const userIdentifier = user.email || user.username || user.publicKey;
        
        try {
            console.log(`\nProcessing user: ${userIdentifier} (${user.publicKey})`);
            
            // Check actual on-chain XLM balance
            const { availableXlmBalance } = await stellar.getXlmBalance(user.publicKey);
            const xlmToSwap = Math.max(0, availableXlmBalance - 2); // Keep 2 XLM for reserves
            
            if (xlmToSwap <= 0.1) {
                console.log(`  Skipping (insufficient balance: ${availableXlmBalance.toFixed(2)} XLM)`);
                result.skippedCount++;
                result.details.push({
                    email: userIdentifier,
                    publicKey: user.publicKey,
                    status: 'skipped',
                    error: `Insufficient balance: ${availableXlmBalance.toFixed(2)} XLM`,
                });
                continue;
            }
            
            console.log(`  XLM balance: ${availableXlmBalance.toFixed(2)} XLM`);
            console.log(`  Will swap: ${xlmToSwap.toFixed(2)} XLM (keeping 2 XLM reserve)`);
            
            // Decrypt user's seed
            const userSecret = await encryption.decrypt(user.seed);
            
            // Ensure HITZ trustline exists before swapping
            console.log(`  Ensuring HITZ trustline...`);
            await stellar.ensureHitzTrustline(userSecret);
            
            // Execute swap via Soroswap
            console.log(`  Executing swap via Soroswap...`);
            const soroswap = new SoroswapClient(env);
            const swapResult = await soroswap.swapXLMToHITZ(xlmToSwap, userSecret, user.publicKey);
            const hitzReceived = swapResult.hitzAmount;
            
            console.log(`  ✅ Swapped ${xlmToSwap.toFixed(2)} XLM → ${hitzReceived.toFixed(2)} HITZ (tx: ${swapResult.txHash})`);
            
            result.successCount++;
            result.totalXLMSwapped += xlmToSwap;
            result.totalHITZReceived += hitzReceived;
            result.details.push({
                email: userIdentifier,
                publicKey: user.publicKey,
                status: 'success',
                xlmSwapped: xlmToSwap,
                hitzReceived: hitzReceived,
            });
            
            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error: any) {
            const errorMessage = error?.message || String(error);
            console.error(`  ❌ Failed to swap for user ${userIdentifier}:`, errorMessage);
            result.errorCount++;
            result.details.push({
                email: userIdentifier,
                publicKey: user.publicKey,
                status: 'error',
                error: errorMessage,
            });
        }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Batch complete!');
    console.log(`  Success: ${result.successCount} users`);
    console.log(`  Skipped: ${result.skippedCount} users (insufficient balance)`);
    console.log(`  Errors: ${result.errorCount} users`);
    console.log(`  Total XLM swapped: ${result.totalXLMSwapped.toFixed(2)} XLM`);
    console.log(`  Total HITZ received: ${result.totalHITZReceived.toFixed(2)} HITZ`);
    if (result.totalXLMSwapped > 0) {
        console.log(`  Average rate: ${(result.totalHITZReceived / result.totalXLMSwapped).toFixed(2)} HITZ per XLM`);
    }
    console.log(`  Progress: ${processedUsers}/${totalUsers} users`);
    if (hasMore) {
        console.log(`  ➡️  Next batch: POST /swap-xlm-to-hitz?offset=${processedUsers}`);
    } else {
        console.log(`  ✅ All users processed!`);
    }
    console.log('═══════════════════════════════════════════');
    
    return result;
}

