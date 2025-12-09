import { AlgoliaClient } from '../algolia/algolia';
import StellarClient from '../stellar/operations';
import Encryption from '../util/encryption';
import SoroswapClient from '../soroswap/client';

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
    const users = await algolia.getAllUsers();
    
    // Filter to users with custodial accounts (those with encrypted seeds)
    const usersWithCustodialAccounts = users.filter(u => u.seed && u.publicKey);
    
    console.log(`Found ${usersWithCustodialAccounts.length} users with custodial accounts to check`);
    console.log('');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let totalXLMSwapped = 0;
    let totalHITZReceived = 0;
    
    for (const user of usersWithCustodialAccounts) {
        try {
            console.log(`\nProcessing user: ${user.email || user.username} (${user.publicKey})`);
            
            // Check actual on-chain XLM balance
            const { availableXlmBalance } = await stellar.getXlmBalance(user.publicKey);
            const xlmToSwap = Math.max(0, availableXlmBalance - 2); // Keep 2 XLM for reserves
            
            if (xlmToSwap <= 0.1) {
                console.log(`  Skipping (insufficient balance: ${availableXlmBalance.toFixed(2)} XLM)`);
                skippedCount++;
                continue;
            }
            
            console.log(`  XLM balance: ${availableXlmBalance.toFixed(2)} XLM`);
            console.log(`  Will swap: ${xlmToSwap.toFixed(2)} XLM (keeping 2 XLM reserve)`);
            
            // Decrypt user's seed
            const userSecret = await encryption.decrypt(user.seed);
            
            // Execute swap via Soroswap
            const soroswap = new SoroswapClient(env);
            const swapResult = await soroswap.swapXLMToHITZ(xlmToSwap, userSecret, user.publicKey);
            const hitzReceived = swapResult.hitzAmount;
            
            console.log(`  ✅ Swapped ${xlmToSwap.toFixed(2)} XLM → ${hitzReceived.toFixed(2)} HITZ`);
            
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
    console.log(`  Skipped: ${skippedCount} users (insufficient balance)`);
    console.log(`  Errors: ${errorCount} users`);
    console.log(`  Total XLM swapped: ${totalXLMSwapped.toFixed(2)} XLM`);
    console.log(`  Total HITZ received: ${totalHITZReceived.toFixed(2)} HITZ`);
    if (totalXLMSwapped > 0) {
        console.log(`  Average rate: ${(totalHITZReceived / totalXLMSwapped).toFixed(2)} HITZ per XLM`);
    }
    
    return { successCount, skippedCount, errorCount, totalXLMSwapped, totalHITZReceived };
}

/**
 * CLI entry point
 */
if (require.main === module) {
    console.log('Run this script via your backend deployment system with proper Env configuration');
    console.log('Example: await swapAllUserXLMToHITZ(env);');
}

