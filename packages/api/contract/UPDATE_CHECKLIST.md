# Staged Changes Update Checklist

## ✅ Status: Files Reviewed and Updated

### Files Removed (Outdated Scratch Files)
- ❌ `new_functions.txt` - Removed (scratch file from development)
- ❌ `reward_tests.txt` - Removed (scratch file from development)

### Files Updated
- ✅ `bindings.sh` - Fixed path issue (removed `cd ./contract`, fixed network typo)

### Files Needing Regeneration (After Build)
- ⚠️ `client.ts` - Needs regeneration from updated contract
  - **Issue**: Has old `init()` signature with emission parameters
  - **Issue**: `emission_info()` returns 3 values instead of 4
  - **Fix**: Run `bash bindings.sh` after building the contract

### Files That Are Current and Correct

#### Core Contracts ✅
- ✅ `src/lib.rs` - Skyhitz Core contract (updated, emission logic removed)
- ✅ `src/hitz_token.rs` - HITZ Token contract (updated with Upgradeable, no Pausable/Burnable)

#### Dependencies ✅
- ✅ `Cargo.toml` - OpenZeppelin dependencies added
- ✅ `Cargo.lock` - Updated with new dependencies

#### Documentation ✅
- ✅ `README.md` - Complete deployment guide
- ✅ `TOKENOMICS_AND_FLOWS.md` - Economic analysis with flow diagrams
- ✅ `CONTRACT_REVIEW.md` - Comprehensive review
- ✅ `STORAGE_ANALYSIS.md` - Storage efficiency analysis (still valid)
- ✅ `STORAGE_VERIFICATION.md` - Storage verification (still valid)

#### Test Snapshots ✅
All 20 test snapshot files are current and match the updated tests:
- ✅ `test_allocate_and_claim_rewards.1.json`
- ✅ `test_apr_calculation.1.json`
- ✅ `test_base_fee_modification.1.json`
- ✅ `test_batch_allocate_rewards.1.json`
- ✅ `test_claim_without_stake.1.json`
- ✅ `test_create_entry.1.json`
- ✅ `test_double_claim.1.json`
- ✅ `test_dynamic_investment.1.json`
- ✅ `test_get_entry_stats.1.json`
- ✅ `test_halving.1.json`
- ✅ `test_init.1.json`
- ✅ `test_investment_below_minimum.1.json`
- ✅ `test_list_entries.1.json`
- ✅ `test_multiple_action_kinds.1.json`
- ✅ `test_negative_base_fee.1.json`
- ✅ `test_proportional_reward_distribution.1.json`
- ✅ `test_record_action_mine_with_stake.1.json`
- ✅ `test_record_action_stream.1.json`
- ✅ `test_supply_cap.1.json`
- ✅ `test_unknown_action_panics.1.json`

## 🔧 Required Actions Before Commit

### 1. Update Rust Version (if needed)
```bash
rustup update stable
# Requires Rust 1.84.0 for Soroban SDK 22
```

### 2. Build Contract
```bash
cargo build --target wasm32-unknown-unknown --release
```

### 3. Regenerate TypeScript Bindings
```bash
bash bindings.sh
```

This will:
- Generate new `client.ts` with correct function signatures
- Update `init()` to use 6 parameters (not 9)
- Update `emission_info()` to return 4 values (not 3)
- Add any new functions from `hitz_token.rs`

### 4. Stage the Regenerated client.ts
```bash
git add client.ts
```

## 📝 Changes in Latest Version

### HITZ Token Contract Changes
- ✅ Emission logic moved from Core to Token
- ✅ Removed Pausable feature
- ✅ Removed Burnable feature
- ✅ Added Upgradeable feature
- ✅ `mint_reward()` function added
- ✅ `emission_info()` now returns 4 values: (epoch, unit_reward, released, remaining)

### Core Contract Changes
- ✅ `init()` now takes 6 parameters (removed emission params)
- ✅ `record_action()` delegates reward minting to HITZ token
- ✅ `emission_info()` proxies to HITZ token
- ✅ All emission helper functions removed

### DataKey Changes
**Removed from Core Contract:**
- ❌ `HalvingStartTs`
- ❌ `HalvingIntervalSec`
- ❌ `Epoch0Reward`
- ❌ `ReleasedTotal`

**Now in HITZ Token Contract:**
- ✅ `HalvingStartTs`
- ✅ `HalvingIntervalSec`
- ✅ `Epoch0Reward`
- ✅ `ReleasedTotal`

## ✅ Final Checklist

Before committing:
- [x] Remove outdated scratch files (new_functions.txt, reward_tests.txt)
- [x] Update bindings.sh
- [ ] Build contract (requires Rust 1.84.0)
- [ ] Regenerate client.ts
- [ ] Stage client.ts
- [ ] Verify all tests pass
- [ ] Commit changes

## 🚨 Important Notes

1. **client.ts is currently outdated** - It has the old contract interface
2. **Must regenerate before deploying** - TypeScript client won't work with new contract otherwise
3. **Frontend will need updates** - Any code using `init()` or `emission_info()` needs updating
4. **Test snapshots are current** - They reflect the updated contract behavior

## 📞 Questions?

If you encounter issues:
1. Ensure Rust 1.84.0 is installed
2. Check that WASM build succeeds
3. Verify stellar CLI is installed and updated
4. Review error messages from bindings generation

---

**Status**: Ready to regenerate client.ts once contract is built
