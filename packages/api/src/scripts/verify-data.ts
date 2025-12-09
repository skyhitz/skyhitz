import 'dotenv/config'
import ContractClient from '../../contract'
import { AlgoliaClient } from '../algolia/algolia'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Verify Data Script
 * 
 * Verifies that on-chain data matches Algolia and generates a reconciliation report.
 * This should be run after investment restoration to ensure data integrity.
 * 
 * Checks:
 * 1. Entry TVL and escrow match between contract and Algolia
 * 2. User stakes match between contract and Algolia
 * 3. Total XLM invested matches expected values
 * 4. All entries exist on-chain
 * 
 * Usage:
 *   yarn ts-node src/scripts/verify-data.ts
 * 
 * Outputs:
 *   - Console summary
 *   - data/verification-report.json (detailed report)
 */

type InvestmentData = {
  usersCount: number
  users: Array<{
    user: string
    entries: Array<{
      entryId: string
      amountStroops: string
    }>
  }>
  entriesWithEscrow: Array<{
    entryId: string
    escrowStroops: string
  }>
}

type VerificationReport = {
  timestamp: string
  summary: {
    totalEntries: number
    entriesVerified: number
    entriesFailed: number
    totalStakesVerified: number
    stakesFailed: number
    totalXLMInvested: number
    totalXLMOnChain: number
    discrepancies: number
  }
  entryDiscrepancies: Array<{
    entryId: string
    field: string
    algoliaValue: number
    onChainValue: number
    difference: number
  }>
  stakeDiscrepancies: Array<{
    entryId: string
    userId: string
    algoliaStake: number
    onChainStake: number
    difference: number
  }>
  errors: Array<{
    entryId?: string
    userId?: string
    error: string
  }>
}

async function verifyEntry(
  contract: ContractClient,
  algolia: AlgoliaClient,
  entryId: string,
  report: VerificationReport
): Promise<void> {
  try {
    // Get on-chain data
    const chainEntry = await contract.getEntry(entryId)
    const chainStats = await contract.getEntryStats(entryId)

    // Get Algolia data
    const algoliaEntry = await algolia.getEntry(entryId)

    // Convert to comparable values (XLM)
    const chainTVL = Number(chainEntry.tvl) / 10_000_000
    const chainEscrow = Number(chainEntry.escrow) / 10_000_000
    const chainAPR = Number(chainStats.apr) / 100

    const algoliaTVL = Number(algoliaEntry.tvl || 0)
    const algoliaEscrow = Number(algoliaEntry.escrow || 0)
    const algoliaAPR = Number(algoliaEntry.apr || 0)

    // Check for discrepancies (allow 0.01 XLM tolerance for rounding)
    const tolerance = 0.01

    if (Math.abs(chainTVL - algoliaTVL) > tolerance) {
      report.entryDiscrepancies.push({
        entryId,
        field: 'tvl',
        algoliaValue: algoliaTVL,
        onChainValue: chainTVL,
        difference: chainTVL - algoliaTVL
      })
      report.summary.discrepancies++
    }

    if (Math.abs(chainEscrow - algoliaEscrow) > tolerance) {
      report.entryDiscrepancies.push({
        entryId,
        field: 'escrow',
        algoliaValue: algoliaEscrow,
        onChainValue: chainEscrow,
        difference: chainEscrow - algoliaEscrow
      })
      report.summary.discrepancies++
    }

    if (Math.abs(chainAPR - algoliaAPR) > 0.1) { // Allow 0.1% tolerance for APR
      report.entryDiscrepancies.push({
        entryId,
        field: 'apr',
        algoliaValue: algoliaAPR,
        onChainValue: chainAPR,
        difference: chainAPR - algoliaAPR
      })
      report.summary.discrepancies++
    }

    report.summary.entriesVerified++
    report.summary.totalXLMOnChain += chainTVL + chainEscrow

  } catch (error) {
    report.summary.entriesFailed++
    report.errors.push({
      entryId,
      error: (error as any)?.message || String(error)
    })
  }
}

async function verifyStake(
  contract: ContractClient,
  algolia: AlgoliaClient,
  entryId: string,
  userPublicKey: string,
  report: VerificationReport
): Promise<void> {
  try {
    // Get on-chain stake
    const chainStake = await contract.getStake(entryId, userPublicKey)

    // Get Algolia user and their stake
    const user = await algolia.getUserByPublicKey(userPublicKey)
    const shares = await algolia.getSharesByEntry(entryId)
    const userShare = shares.find(s => s.userId === user.id)
    const algoliaStake = userShare?.shares || 0

    // Convert to comparable values (stroops)
    const chainStakeStroops = Number(chainStake)
    const algoliaStakeStroops = Number(algoliaStake)

    // Check for discrepancies (allow 1 stroop tolerance)
    if (Math.abs(chainStakeStroops - algoliaStakeStroops) > 1) {
      report.stakeDiscrepancies.push({
        entryId,
        userId: userPublicKey,
        algoliaStake: algoliaStakeStroops,
        onChainStake: chainStakeStroops,
        difference: chainStakeStroops - algoliaStakeStroops
      })
      report.summary.discrepancies++
    }

    report.summary.totalStakesVerified++

  } catch (error) {
    report.summary.stakesFailed++
    report.errors.push({
      entryId,
      userId: userPublicKey,
      error: (error as any)?.message || String(error)
    })
  }
}

async function main() {
  console.log('🔍 Starting data verification process...\n')

  const env = (globalThis as any).ENV || (process as any).env
  const contract = new ContractClient(env)
  const algolia = new AlgoliaClient(env)

  // Read investment data
  const dataPath = join(process.cwd(), '../..', 'data', 'user-investments.json')
  console.log('📂 Reading data from:', dataPath)
  
  const rawData = readFileSync(dataPath, 'utf-8')
  const investmentData: InvestmentData = JSON.parse(rawData)

  // Initialize report
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEntries: 0,
      entriesVerified: 0,
      entriesFailed: 0,
      totalStakesVerified: 0,
      stakesFailed: 0,
      totalXLMInvested: 0,
      totalXLMOnChain: 0,
      discrepancies: 0
    },
    entryDiscrepancies: [],
    stakeDiscrepancies: [],
    errors: []
  }

  // Collect all unique entry IDs
  const entryIds = new Set<string>()
  for (const userData of investmentData.users) {
    for (const investment of userData.entries) {
      entryIds.add(investment.entryId)
      report.summary.totalXLMInvested += Number(investment.amountStroops) / 10_000_000
    }
  }
  for (const escrowEntry of investmentData.entriesWithEscrow) {
    entryIds.add(escrowEntry.entryId)
  }

  report.summary.totalEntries = entryIds.size
  console.log(`📊 Verifying ${report.summary.totalEntries} entries...\n`)

  // Verify each entry
  let progress = 0
  for (const entryId of Array.from(entryIds)) {
    progress++
    console.log(`[${progress}/${report.summary.totalEntries}] Verifying ${entryId.substring(0, 30)}...`)
    
    await verifyEntry(contract, algolia, entryId, report)
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  // Verify user stakes
  console.log('\n📊 Verifying user stakes...\n')
  let stakeProgress = 0
  const totalStakes = investmentData.users.reduce((sum, u) => sum + u.entries.length, 0)

  for (const userData of investmentData.users) {
    for (const investment of userData.entries) {
      stakeProgress++
      console.log(`[${stakeProgress}/${totalStakes}] Verifying stake for ${userData.user.substring(0, 10)}... in ${investment.entryId.substring(0, 20)}...`)
      
      await verifyStake(contract, algolia, investment.entryId, userData.user, report)
      
      // Add small delay
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION REPORT')
  console.log('='.repeat(60))
  console.log(`Timestamp: ${report.timestamp}`)
  console.log('\nEntries:')
  console.log(`  Total: ${report.summary.totalEntries}`)
  console.log(`  ✅ Verified: ${report.summary.entriesVerified}`)
  console.log(`  ❌ Failed: ${report.summary.entriesFailed}`)
  console.log('\nStakes:')
  console.log(`  ✅ Verified: ${report.summary.totalStakesVerified}`)
  console.log(`  ❌ Failed: ${report.summary.stakesFailed}`)
  console.log('\nXLM Totals:')
  console.log(`  Expected (from data): ${report.summary.totalXLMInvested.toFixed(2)} XLM`)
  console.log(`  On-chain (TVL + Escrow): ${report.summary.totalXLMOnChain.toFixed(2)} XLM`)
  console.log(`  Difference: ${(report.summary.totalXLMOnChain - report.summary.totalXLMInvested).toFixed(2)} XLM`)
  console.log('\nDiscrepancies:')
  console.log(`  Total: ${report.summary.discrepancies}`)
  console.log(`  Entry discrepancies: ${report.entryDiscrepancies.length}`)
  console.log(`  Stake discrepancies: ${report.stakeDiscrepancies.length}`)
  console.log('='.repeat(60))

  // Show sample discrepancies
  if (report.entryDiscrepancies.length > 0) {
    console.log('\n⚠️  Sample Entry Discrepancies (first 5):')
    report.entryDiscrepancies.slice(0, 5).forEach(d => {
      console.log(`  - ${d.entryId.substring(0, 20)}... (${d.field})`)
      console.log(`    Algolia: ${d.algoliaValue}, On-chain: ${d.onChainValue}, Diff: ${d.difference.toFixed(4)}`)
    })
  }

  if (report.stakeDiscrepancies.length > 0) {
    console.log('\n⚠️  Sample Stake Discrepancies (first 5):')
    report.stakeDiscrepancies.slice(0, 5).forEach(d => {
      console.log(`  - ${d.userId.substring(0, 10)}... in ${d.entryId.substring(0, 20)}...`)
      console.log(`    Algolia: ${d.algoliaStake}, On-chain: ${d.onChainStake}, Diff: ${d.difference}`)
    })
  }

  if (report.errors.length > 0) {
    console.log('\n❌ Errors (first 5):')
    report.errors.slice(0, 5).forEach(e => {
      console.log(`  - ${e.entryId || e.userId || 'Unknown'}`)
      console.log(`    ${e.error}`)
    })
  }

  // Save detailed report to file
  const reportPath = join(process.cwd(), '../..', 'data', 'verification-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)

  // Exit with error code if there are significant issues
  if (report.summary.discrepancies > 0 || report.errors.length > 0) {
    console.log('\n⚠️  Verification completed with issues. Please review the report.')
    process.exit(1)
  }

  console.log('\n✅ All data verified successfully!')
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})

