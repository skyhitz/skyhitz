# Deployment Checklist - V2 Post-Exhaustion Model

## ✅ Pre-Deployment Verification

### Code Quality
- [x] All critical issues resolved
- [x] Post-exhaustion model implemented (no minting)
- [x] 1:1 staking ratio (no oracle dependency)
- [x] HITZ-only economy (no XLM fees)
- [x] 0.05% daily distribution rate
- [x] Artist equity system implemented
- [x] Unstaking functionality added
- [x] 3-phase batch distribution for scalability
- [x] Contracts compile successfully
- [x] Tests passing
- [x] TypeScript bindings generated

### Security Review
- [x] No minting functions (supply exhausted)
- [x] No oracle-dependent calculations
- [x] Treasury separation implemented
- [x] Rate-limited distribution (0.05% daily)
- [x] Input validation on all functions
- [x] Overflow protection (saturating arithmetic)
- [x] Batch size limits (DOS protection)
- [x] Auth checks on privileged functions
- [x] Safe transfers with balance verification

### Performance Verification
- [x] distribute_rewards() optimized (batched)
- [x] Gas estimates within limits
- [x] Contract size < 100KB (41KB ✓)
- [x] No unbounded loops
- [x] Storage operations minimized
- [x] MAX_ENTRIES limit (10,000)

---

## 🚀 Deployment Steps

### 1. Build Contract

```bash
cd packages/api/contract

# Build for WebAssembly
cargo build --target wasm32-unknown-unknown --release

# Verify output
ls -lh target/wasm32-unknown-unknown/release/skyhitz.wasm
# Should show ~41KB
```

### 2. Deploy Core Contract (V2 Post-Exhaustion)

#### A. Install WASM

```bash
# Install WASM and get hash
WASM_HASH=$(stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015")

echo "WASM Hash: $WASM_HASH"
```

#### B. Deploy Contract

```bash
# Deploy contract
CONTRACT_ID=$(stellar contract deploy \
  --wasm-hash $WASM_HASH \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015")

echo "Contract ID: $CONTRACT_ID"
```

#### C. Initialize Contract (V2 - No XLM Token)

```bash
# Initialize core contract
# NOTE: V2 does not require xlm-token parameter
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- init \
  --admin ADMIN_ADDRESS \
  --treasury TREASURY_ADDRESS \
  --hitz-token $HITZ_TOKEN_ID \
  --base-fee 1000000
```

### 3. Verify Deployment

```bash
# Verify contract version
stellar contract invoke \
  --id $CONTRACT_ID \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- version

# Verify base fee
stellar contract invoke \
  --id $CONTRACT_ID \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- get_base_fee
```

### 4. Test Critical Functions

```bash
# Create test entry
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- create_entry \
  --entry-id "test_song_001"

# Test upgrade function (dry run)
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  --simulate-only \
  -- upgrade_core \
  --new-wasm-hash $WASM_HASH

# Should succeed without errors
```

---

## 🧪 Testing Checklist

### V2 Functional Tests
- [ ] Create entry works
- [ ] Record action (stream) - HITZ fee to treasury
- [ ] Record action (mine) - 1:1 staking works
- [ ] Record action (invest) - minimum 3 HITZ enforced
- [ ] Distribute rewards works (Treasury-only, 0.05% rate)
- [ ] Claim rewards works (proportional to stake)
- [ ] Artist equity claim works
- [ ] Unstake returns HITZ to user
- [ ] Upgrade function accessible (admin only)

### Performance Tests
- [ ] Gas usage acceptable (< 1M per transaction)
- [ ] Batch distribution handles 100+ entries
- [ ] No timeout errors
- [ ] 3-phase distribution completes

### Security Tests
- [ ] Non-admin cannot upgrade
- [ ] Non-treasury cannot distribute
- [ ] No minting occurs (verify supply unchanged)
- [ ] Oracle price changes have no effect on staking
- [ ] Batch size limits enforced
- [ ] 1:1 staking verified (fee = stake)

---

## 📊 Monitoring Setup

### V2 Metrics to Track

1. **Token Economics**
   - Treasury HITZ balance
   - Daily distribution amount (0.05% of treasury)
   - Total reward pools across entries
   - Total staked HITZ

2. **Gas Usage**
   - distribute_rewards_batch: Target < 500K gas
   - record_action: Target < 100K gas
   - claim_rewards: Target < 150K gas
   - unstake: Target < 100K gas

3. **Entry Metrics**
   - Total entries count
   - Entries with escrow > 0
   - Total escrow across entries
   - Average APR

### Monitoring Script Example

```typescript
async function monitorContractV2() {
  // Check treasury balance
  const treasuryBalance = await hitzToken.balance(treasuryAddress);
  const dailyDistribution = treasuryBalance * 5n / 10000n;
  
  console.log('Treasury Status:', {
    balance: Number(treasuryBalance) / 1e7,
    dailyDistribution: Number(dailyDistribution) / 1e7,
  });
  
  // Check contract stats
  const entries = await coreContract.list_entries(0, 100);
  let totalEscrow = 0n;
  let totalRewardPool = 0n;
  
  for (const entry of entries) {
    totalEscrow += entry.escrow_xlm;  // Now HITZ
    totalRewardPool += await coreContract.get_reward_pool(entry.id);
  }
  
  console.log('Entry Stats:', {
    totalEntries: entries.length,
    totalEscrow: Number(totalEscrow) / 1e7,
    totalRewardPool: Number(totalRewardPool) / 1e7,
  });
}

// Run every hour
setInterval(monitorContractV2, 3600000);
```

---

## 🔄 Upgrade Process

### When to Upgrade

- Bug fixes
- Performance improvements
- New features
- Security patches

### Upgrade Steps (V2)

```bash
# 1. Build new version
cargo build --target wasm32-unknown-unknown --release

# 2. Install new WASM
NEW_WASM_HASH=$(stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015")

# 3. Upgrade contract
stellar contract invoke \
  --id $CONTRACT_ID \
  --source-account ADMIN_KEYPAIR \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- upgrade_core \
  --new-wasm-hash $NEW_WASM_HASH

# 4. Verify upgrade
stellar contract invoke \
  --id $CONTRACT_ID \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- version
```

---

## 🛡️ Security Best Practices

### Key Management

1. **Admin Keys**
   - Store in hardware wallet (Ledger/Trezor)
   - Use cold storage
   - Never expose online
   - Required for: upgrades, entry creation, set_base_fee, artist equity

2. **Treasury Keys**
   - Separate hot wallet for bot
   - Rotate periodically
   - Monitor closely
   - Required for: distribute_rewards only

### Access Control (V2)

```
Admin Wallet (Cold Storage)
├─ Create entries
├─ Set base fee
├─ Allocate rewards (manual)
├─ Set artist equity
├─ Merge/remove entries
├─ Upgrade contracts
└─ Emergency operations

Treasury Wallet (Hot - Bot)
├─ Distribute rewards (automated)
└─ Rate-limited to 0.05%/day

Users
├─ Record actions (pay HITZ fees)
├─ Stake HITZ (mine/invest)
├─ Claim rewards
├─ Unstake HITZ
└─ Claim artist equity (if verified)
```

---

## 📋 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Announce contract addresses
- [ ] Update frontend config
- [ ] Update Treasury bot with 0.05% rate
- [ ] Monitor first transactions
- [ ] Verify no minting occurs

### Week 1
- [ ] Monitor gas usage patterns
- [ ] Verify distribution proportions correct
- [ ] Check APR calculations
- [ ] Test unstaking flow
- [ ] Collect user feedback

### Month 1
- [ ] Review distribution curve
- [ ] Analyze treasury depletion rate
- [ ] Verify 12-year runway on track
- [ ] Consider any optimizations

---

## ✅ Deployment Approval

### Sign-off Required

- [ ] Code reviewed and approved
- [ ] V2 model verified (no minting, 1:1 staking)
- [ ] Tests all passing
- [ ] Documentation updated for V2
- [ ] Testnet deployment successful
- [ ] Monitoring setup complete
- [ ] Treasury funded with HITZ
- [ ] Key management secure

### Final Checks

- [ ] Contract addresses recorded
- [ ] Admin keys secured (cold storage)
- [ ] Treasury bot configured (0.05% rate)
- [ ] Frontend updated for HITZ-only
- [ ] Users notified of changes
- [ ] Monitoring active

---

**Status**: ✅ Ready for Deployment
**Version**: 2.0.0 (Post-Exhaustion)
**Date**: January 2026
**Model**: HITZ-only, 1:1 staking, 0.05% daily distribution
