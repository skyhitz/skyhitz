import ContractClient from '../../contract';
import { AlgoliaClient } from '../algolia/algolia';

/**
 * Migration Script: Convert on-chain XLM values to HITZ equivalent
 * 
 * Conversion rate: 1 HITZ = 0.1 XLM (multiply XLM values by 10)
 * 
 * This script updates Algolia entries to reflect the new HITZ-based economy.
 * Run this AFTER deploying the updated contract.
 */
export async function migrateContractData(env: Env) {
    console.log('🔄 Starting contract data migration: XLM → HITZ');
    console.log('Conversion rate: 1 HITZ = 0.1 XLM (10x multiplier)');
    console.log('');
    
    const contract = new ContractClient(env);
    const algolia = new AlgoliaClient(env);
    
    // Get all entries from Algolia
    console.log('Fetching all entries from Algolia...');
    const entries = await algolia.getAllEntries();
    console.log(`Found ${entries.length} entries to migrate`);
    console.log('');
    
    let successCount = 0;
    let errorCount = 0;
    let totalTvlXLM = 0;
    let totalEscrowXLM = 0;
    let totalTvlHITZ = 0;
    let totalEscrowHITZ = 0;
    
    for (const entry of entries) {
        try {
            // Get current on-chain data
            const onChainEntry = await contract.getEntry(entry.objectID);
            
            // Convert HITZ values (already in HITZ on new contract)
            // Algolia values should be in display format (divided by 10_000_000)
            const tvlHitz = Number(onChainEntry.tvl_xlm) / 10_000_000;
            const escrowHitz = Number(onChainEntry.escrow_xlm) / 10_000_000;
            
            // Get stats for APR
            const stats = await contract.getEntryStats(entry.objectID);
            
            console.log(`Migrating entry ${entry.objectID} (${entry.title || 'Unknown'})`);
            console.log(`  TVL: ${tvlHitz.toFixed(2)} HITZ`);
            console.log(`  Escrow: ${escrowHitz.toFixed(2)} HITZ`);
            console.log(`  APR: ${Number(stats.apr) / 100}%`);
            
            // Update Algolia with new HITZ values
            await algolia.partialUpdateEntry({
                objectID: entry.objectID,
                tvl: tvlHitz,
                escrow: escrowHitz,
                apr: Number(stats.apr) / 100,
                totalStaked: Number(stats.totalStaked) / 10_000_000,
            });
            
            totalTvlHITZ += tvlHitz;
            totalEscrowHITZ += escrowHitz;
            successCount++;
            
        } catch (error) {
            console.error(`❌ Failed to migrate entry ${entry.objectID}:`, error);
            errorCount++;
        }
    }
    
    console.log('');
    console.log('✅ Migration complete!');
    console.log(`  Success: ${successCount} entries`);
    console.log(`  Errors: ${errorCount} entries`);
    console.log(`  Total TVL: ${totalTvlHITZ.toFixed(2)} HITZ`);
    console.log(`  Total Escrow: ${totalEscrowHITZ.toFixed(2)} HITZ`);
    
    return { successCount, errorCount, totalTvlHITZ, totalEscrowHITZ };
}

/**
 * CLI entry point
 */
if (require.main === module) {
    // This allows running the script directly
    console.log('Run this script via your backend deployment system with proper Env configuration');
    console.log('Example: await migrateContractData(env);');
}

