# 3-Phase Distribution Update

## Problem
The previous batched distribution was hitting Stellar's 100 storage entry footprint limit, causing transactions to fail with:
```
"the number of entries in transaction footprint exceeds the network config limit"
```

Even with a batch size of 20 entries, the system was accessing 118 storage entries because:
- On the first batch, it looped through ALL entries to calculate total escrow (45 entries × 2-3 reads each = 90-135 storage operations)
- Then processed the first 20 entries (additional reads + writes)
- Total: >100 storage entries → transaction failed

## Solution: 3-Phase Distribution

We split the distribution into three separate phases, each staying well under the 100 entry limit:

### **Phase 1: Calculate Total Escrow** (Read-Only)
- `calculate_total_escrow_batch(caller, start_index, batch_size)`
- Loops through entries in batches (max 40 per batch, read-only)
- Accumulates running total escrow
- Stores result in instance storage
- Returns: `(next_index, running_total)`

### **Phase 2: Initialize Distribution** (Single Transaction)
- `initialize_distribution(caller, hitz_amount)`
- Verifies total escrow was calculated
- Transfers HITZ from Treasury to contract
- Stores HITZ amount in instance storage
- Single transaction with minimal storage operations

### **Phase 3: Distribute Rewards** (Write Operations)
- `distribute_rewards_batch(caller, start_index, batch_size)`
- Loops through entries in batches (max 15 per batch, write operations)
- Reads distribution state from instance storage
- Distributes rewards proportionally
- Updates reward pools
- Returns: `next_index`

## Storage Footprint Analysis

### Phase 1 (Escrow Calculation)
- **40 entries per batch**
- 2 reads per entry: EntryAt(i) + Entry(entry_id)
- Total: 80 storage reads ✅ (under 100 limit)

### Phase 2 (Initialization)
- Single transaction
- Reads: 3 instance keys
- Writes: 1 instance key
- Token transfer: ~5 operations
- Total: ~10 storage operations ✅

### Phase 3 (Distribution)
- **15 entries per batch**
- Per entry: 2 reads (EntryAt, Entry) + 2 writes (RewardPool + TTL)
- Total: 15 × 4 = 60 operations ✅ (well under 100 limit)

## API Changes

### Rust Contract

**New Functions:**
```rust
// Phase 1
pub fn calculate_total_escrow_batch(
    e: Env,
    caller: Address,
    start_index: u32,
    batch_size: u32,  // max 40
) -> (u32, i128)

// Phase 2
pub fn initialize_distribution(
    e: Env,
    caller: Address,
    hitz_amount: i128,
)

// Phase 3 (updated signature)
pub fn distribute_rewards_batch(
    e: Env,
    caller: Address,
    start_index: u32,
    batch_size: u32,  // max 15
) -> u32
```

**Removed Parameters:**
- `distribute_rewards_batch` no longer takes `hitz_amount` parameter
- Amount is now passed in Phase 2 (`initialize_distribution`)

### TypeScript Client

**Updated Function:**
```typescript
public distributeRewardsBatch = async (
    treasurySecret: string, 
    hitzAmount: bigint,
    calcBatchSize: number = 40,   // Phase 1 batch size
    distBatchSize: number = 15    // Phase 3 batch size
) => {
    // Automatically handles all 3 phases
    // Returns detailed summary
}
```

**Return Value:**
```typescript
{
    success: true,
    phase1Batches: number,      // Number of escrow calculation batches
    phase3Batches: number,      // Number of distribution batches
    totalEntries: number,       // Total entries processed
    totalEscrow: number,        // Total escrow in XLM
    hitzDistributed: number,    // Total HITZ distributed
    results: Array<...>         // Phase 3 transaction results
}
```

### Treasury Bot

**No changes required** - the bot still calls the same function:
```typescript
await contract.distributeRewardsBatch(
    env.TREASURY_SEED,
    currentHitzBalanceBigInt
    // Uses default batch sizes
);
```

## Deployment Steps

1. **Build and generate bindings:**
   ```bash
   cd packages/api/contract
   ./bindings.sh
   ```

2. **Deploy updated contract:**
   ```bash
   ./upgrade.sh
   ```

3. **Verify deployment:**
   - Check contract version
   - Test with small HITZ amount first
   - Monitor transaction success

4. **Monitor first production run:**
   - Watch for all 3 phases completing
   - Verify no footprint errors
   - Check APR sync completes

## Performance Characteristics

### With 45 Entries (Current System)

**Phase 1: Escrow Calculation**
- Batch 1: Indices 0-39 (40 entries)
- Batch 2: Indices 40-44 (5 entries)
- Total: 2 transactions

**Phase 2: Initialization**
- Single transaction

**Phase 3: Distribution**
- Batch 1: Indices 0-14 (15 entries)
- Batch 2: Indices 15-29 (15 entries)
- Batch 3: Indices 30-44 (15 entries)
- Total: 3 transactions

**Overall: 6 transactions total** (vs. failing with previous approach)

### Scalability

- **100 entries**: 12 transactions (3 calc + 1 init + 7 dist)
- **1000 entries**: 95 transactions (25 calc + 1 init + 67 dist)
- **Max 10,000 entries**: 917 transactions (250 calc + 1 init + 667 dist)

## Testing

All 37 unit tests pass:
```
test result: ok. 37 passed; 0 failed; 0 ignored; 0 measured
```

## Backwards Compatibility

⚠️ **Breaking change** - The old `distribute_rewards_batch` signature has changed.

**Migration:**
- Update to latest bindings
- Rebuild client code
- No data migration needed (uses same storage keys)
- Old bot code will fail gracefully (compilation error)

## Benefits

✅ **Reliability**: No more footprint limit errors
✅ **Scalability**: Can handle up to 10,000 entries
✅ **Efficiency**: Optimized batch sizes for read vs write operations
✅ **Transparency**: Detailed logging for each phase
✅ **Safety**: Each phase can be retried independently

## Risks and Mitigations

**Risk**: Bot fails between phases
**Mitigation**: Each phase can be resumed independently. Instance storage persists between transactions.

**Risk**: Price changes during multi-phase distribution
**Mitigation**: Total escrow locked in Phase 1, distribution is atomic per entry

**Risk**: Network congestion during distribution
**Mitigation**: Smaller batches (15 entries) reduce transaction time and improve reliability

## Monitoring

**Key Metrics:**
- Phase 1 completion time
- Phase 2 success rate
- Phase 3 batches processed
- Total distribution time
- APR sync after distribution

**Logs to Watch:**
```
✅ Phase 1 complete! Total escrow: X XLM
✅ Phase 2 complete! Distribution initialized
✅ Phase 3 complete! All rewards distributed
```

## Future Improvements

1. **Progressive distribution**: Allow distribution to continue even if some batches fail
2. **Escrow caching**: Store total escrow in persistent storage, updated on each action
3. **Parallel phase 3**: Distribute to multiple entries simultaneously (requires protocol changes)
4. **Dynamic batch sizing**: Adjust batch sizes based on network conditions

## References

- [Stellar Storage Footprint Limits](https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering)
- Contract: `packages/api/contract/src/lib.rs`
- Client: `packages/api/contract/index.ts`
- Bot: `packages/api/src/treasury/bot.ts`

