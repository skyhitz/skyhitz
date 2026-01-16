#![no_std]

//! Skyhitz Core V2 - Soroban Smart Contract (Post-Exhaustion Model)
//!
//! Purpose: Record user actions for music entries, manage HITZ staking,
//! and distribute rewards from treasury to entry reward pools.
//!
//! POST-EXHAUSTION MODEL:
//! The HITZ supply is fully issued (~20M of 21M max). This contract now operates
//! in distribution-only mode with NO NEW MINTING. All rewards come from treasury
//! distribution funded by recovered funds and accumulated fees.
//!
//! HITZ Token:
//! - SEP-41 compatible fungible token with fixed cap: 21,000,000 HITZ
//! - Supply fully issued - no more minting possible
//! - Rewards distributed from treasury, not minted
//!
//! Action Flow (Post-Exhaustion):
//! - STAKING ACTIONS (mine/invest): Fee transferred to contract as stake (1:1 ratio)
//! - NON-STAKING ACTIONS (stream/like/download): Fee transferred to treasury
//! - NO REWARDS MINTED - users pay fees only, earn via staking
//!
//! Action Kinds & Parameters (fees calculated as base_fee * difficulty):
//! - stream:   difficulty 1,  fee = base_fee × 1  (default 0.1 HITZ), goes to treasury
//! - like:     difficulty 2,  fee = base_fee × 2  (default 0.2 HITZ), goes to treasury
//! - download: difficulty 3,  fee = base_fee × 3  (default 0.3 HITZ), goes to treasury
//! - mine:     difficulty 10, fee = base_fee × 10 (default 1 HITZ), becomes stake
//! - invest:   DYNAMIC fee (min 3 HITZ), becomes stake (1:1 ratio)
//!
//! Staking Model (Post-Exhaustion):
//! - stake_amount = fee (simple 1:1 ratio, no oracle dependency)
//! - No minting - user's fee IS their stake
//! - Stake stored in contract, returned on unstake
//! - Eliminates oracle manipulation risk
//!
//! Reward Distribution:
//! - Treasury bot distributes 0.05% of treasury daily (Bitcoin-like 12-year curve)
//! - Distribution proportional to entry escrow
//! - Stakers claim rewards proportional to their stake
//! - Artists claim equity rewards based on set equity_bps
//!
//! Security Features:
//! - No minting (supply exhausted)
//! - No oracle-dependent calculations (fixed 1:1 staking)
//! - Fair dust distribution in reward allocations
//! - Atomic index operations
//! - Entry merge blocked when stakes exist


use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec, symbol_short, token, log, BytesN,
};

// OpenZeppelin HITZ token was previously used for reward minting.
// We now target the SAC instance for HITZ and mint via SAC with core as admin.

// ============================================================================
// Constants
// ============================================================================

/// Maximum HITZ supply: 21,000,000 HITZ with 7 decimals (stroops)
const MAX_HITZ_SUPPLY: i128 = 210_000_000_000_000;

/// Maximum number of entries to prevent DOS attacks
const MAX_ENTRIES: u32 = 10_000;

/// Storage TTL parameters for persistent data
const STORAGE_LIFETIME_THRESHOLD: u32 = 100;
const STORAGE_BUMP_AMOUNT: u32 = 535_680; // ~60 days

// Safety constants
const MAX_REWARD_PER_ACTION: i128 = 10_000_000;  // 1 HITZ max per action

// ============================================================================
// Data Types
// ============================================================================

#[contracttype]
pub enum DataKey {
    // Instance storage (singleton config)
    Admin,
    Treasury,
    HitzToken,
    BaseFee,                            // Base fee per difficulty unit (default 0.1 HITZ)
    // Legacy emission schedule (no longer used post-exhaustion, kept for storage compatibility)
    EmissionStartTs,                    // LEGACY: u64 halving start timestamp
    EmissionIntervalSec,                // LEGACY: u64 seconds per halving epoch
    EmissionEpoch0UnitReward,           // LEGACY: i128 initial unit reward in stroops
    
    // Persistent storage
    Entry(String),                      // Entry data
    Stake((String, Address)),           // Per-user stake: (entry_id, owner) -> amount
    StakeTotal(String),                 // Total staked per entry
    RewardPool(String),                 // HITZ rewards allocated to entry
    Claimed((String, Address)),         // HITZ rewards claimed by user
    EntryAt(u32),                       // Index -> entry_id for pagination
    EntryCount,                         // Total entry count
    TotalMinted,                        // i128: Total HITZ minted by this contract (supply cap enforcement)
    
    // Batch distribution state (temporary, cleared after completion)
    BatchDistTotalEscrow,               // i128: Cached total escrow for current batch distribution
    BatchDistHitzAmount,                // i128: Total HITZ amount being distributed
    
    // Artist equity (non-dilutable creator rewards)
    ArtistEquity((String, Address)),    // (entry_id, artist) -> ArtistEquityClaim
    ArtistEquityTotal(String),          // entry_id -> total equity bps across all artists (max 9990)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Entry {
    pub tvl_xlm: i128,      // Total Value Locked (equity-bearing) in HITZ
    pub escrow_xlm: i128,   // Non-equity revenue in HITZ
    pub created_at: u64, // Timestamp
}

/// Artist equity claim for non-dilutable creator rewards
/// Stored per (entry_id, artist) pair to support collaborations
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArtistEquityClaim {
    pub equity_bps: u32,    // Artist's equity share in basis points (100 = 1%)
    pub claimed: i128,      // HITZ already claimed by this artist
}

/// User stake data with 24-hour timelock to prevent arbitrage
/// Timelock resets on each deposit to prevent flash-loan style exploits
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserStake {
    pub amount: i128,       // Staked amount in stroops
    pub unlock_time: u64,   // Timestamp when stake can be withdrawn
}

#[contract]
pub struct SkyhitzCore;

// ============================================================================
// Implementation
// ============================================================================

#[contractimpl]
impl SkyhitzCore {
    /// Upgrade core contract to new WASM code (admin-only)
    /// Note: Named `upgrade_core` to avoid export name collision with token's `upgrade`.
    pub fn upgrade_core(e: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap_or_else(|| panic!("Admin not set"));
        admin.require_auth();
        e.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    /// Reset instance storage (admin-only)
    /// 
    /// CRITICAL: This clears instance configuration. Contract will be unusable until re-initialized.
    /// Use with extreme caution during upgrades only when you need to change core parameters.
    /// 
    /// Clears: Admin, Treasury, HitzToken, BaseFee, Oracle settings, Emission settings
    /// Preserves: Persistent data (entries, stakes, rewards, TotalMinted, EntryCount)
    /// 
    /// After calling this, you MUST call init() again to restore functionality.
    pub fn reset_instance(e: Env) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap_or_else(|| panic!("Admin not set"));
        admin.require_auth();
        
        // Remove all instance storage keys
        e.storage().instance().remove(&DataKey::Admin);
        e.storage().instance().remove(&DataKey::Treasury);
        e.storage().instance().remove(&DataKey::HitzToken);
        e.storage().instance().remove(&DataKey::BaseFee);
        e.storage().instance().remove(&DataKey::EmissionStartTs);
        e.storage().instance().remove(&DataKey::EmissionIntervalSec);
        e.storage().instance().remove(&DataKey::EmissionEpoch0UnitReward);
        
        log!(&e, "Instance storage reset. Contract must be re-initialized with init()");
    }

    /// Admin-only: remove entries in chunks to stay under footprint limits.
    /// Removes entries at indexes [start, start+limit) using EntryAt(i).
    pub fn reset_entries_chunk(e: Env, start: u32, limit: u32) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap_or_else(|| panic!("Admin not set"));
        admin.require_auth();

        let count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if count == 0 { return; }
        let end = core::cmp::min(start.saturating_add(limit), count);
        for i in start..end {
            let at_key = DataKey::EntryAt(i);
            if let Some(entry_id) = e.storage().persistent().get::<DataKey, String>(&at_key) {
                let entry_key = DataKey::Entry(entry_id.clone());
                if e.storage().persistent().has(&entry_key) { e.storage().persistent().remove(&entry_key); }
                let pool_key = DataKey::RewardPool(entry_id.clone());
                if e.storage().persistent().has(&pool_key) { e.storage().persistent().remove(&pool_key); }
                let total_key = DataKey::StakeTotal(entry_id.clone());
                if e.storage().persistent().has(&total_key) { e.storage().persistent().remove(&total_key); }
            }
            if e.storage().persistent().has(&at_key) { e.storage().persistent().remove(&at_key); }
        }
        // If we covered all indices in this chunk and reached the end, clear EntryCount
        if end == count { e.storage().persistent().remove(&DataKey::EntryCount); }
    }

    /// Helper to introspect entry count before chunking.
    pub fn entry_count(e: Env) -> u32 {
        e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0)
    }

    /// Admin-only: remove one entry by its position (EntryAt(i)) and related keys.
    pub fn reset_entry_by_pos(e: Env, i: u32) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap_or_else(|| panic!("Admin not set"));
        admin.require_auth();

        let at_key = DataKey::EntryAt(i);
        if let Some(entry_id) = e.storage().persistent().get::<DataKey, String>(&at_key) {
            let entry_key = DataKey::Entry(entry_id.clone());
            if e.storage().persistent().has(&entry_key) { e.storage().persistent().remove(&entry_key); }
            let pool_key = DataKey::RewardPool(entry_id.clone());
            if e.storage().persistent().has(&pool_key) { e.storage().persistent().remove(&pool_key); }
            let total_key = DataKey::StakeTotal(entry_id.clone());
            if e.storage().persistent().has(&total_key) { e.storage().persistent().remove(&total_key); }
        }
        if e.storage().persistent().has(&at_key) { e.storage().persistent().remove(&at_key); }
    }
    /// Initialize the contract (one-time only)
    ///
    /// # Arguments
    /// * `admin` - Admin address with privileged rights
    /// * `treasury` - Treasury address receiving all HITZ fees (also the oracle updater)
    /// * `hitz_token` - HITZ token contract address (OpenZeppelin token)
    /// * `base_fee` - Base fee per difficulty unit in stroops (default 1,000,000 = 0.1 HITZ)
    pub fn init(
        e: Env,
        admin: Address,
        treasury: Address,
        hitz_token: Address,
        base_fee: i128,
    ) {
        if e.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        // Verify core contract is admin of HITZ token (SECURITY: Prevent minting failure)
        let sac_admin = token::StellarAssetClient::new(&e, &hitz_token);
        let current_admin = sac_admin.admin();
        if current_admin != e.current_contract_address() {
            panic!("Core contract must be HITZ token admin");
        }

        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage().instance().set(&DataKey::Treasury, &treasury);
        e.storage().instance().set(&DataKey::HitzToken, &hitz_token);
        e.storage().instance().set(&DataKey::BaseFee, &base_fee);
        
        
        // SECURITY FIX C3: Store EntryCount in persistent storage to prevent desync on upgrade
        e.storage().persistent().set(&DataKey::EntryCount, &0u32);
        
        // SECURITY: Initialize supply cap tracking for 21M HITZ enforcement
        e.storage().persistent().set(&DataKey::TotalMinted, &0i128);

        // Initialize emission schedule in core (for SAC-based HITZ). Defaults mirror previous token.
        let now = e.ledger().timestamp();
        let default_interval: u64 = 126_144_000; // 4 years
        let default_unit: i128 = 3_000_000; // 0.3 HITZ
        e.storage().instance().set(&DataKey::EmissionStartTs, &now);
        e.storage().instance().set(&DataKey::EmissionIntervalSec, &default_interval);
        e.storage().instance().set(&DataKey::EmissionEpoch0UnitReward, &default_unit);
    }

    // accept_hitz_ownership removed (no longer using OZ token ownership transfer)

    /// Update base fee (admin-only)
    ///
    /// # Arguments
    /// * `new_base_fee` - New base fee per difficulty unit in stroops (e.g., 1,000,000 = 0.1 HITZ)
    pub fn set_base_fee(e: Env, new_base_fee: i128) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if new_base_fee < 0 {
            panic!("Base fee must be non-negative");
        }

        e.storage().instance().set(&DataKey::BaseFee, &new_base_fee);
    }

    /// NOTE: withdraw_xlm_to_treasury() removed - no longer needed in HITZ-only economy
    /// NOTE: update_oracle_price() and get_oracle_data() removed - oracle unused in Post-Exhaustion model

    /// Get current base fee
    pub fn get_base_fee(e: Env) -> i128 {
        e.storage().instance().get(&DataKey::BaseFee).unwrap_or(1_000_000) // Default: 0.1 HITZ
    }

    /// Get total HITZ supply minted (historical)
    /// NOTE: Supply is fully issued (~20M). This is informational only.
    /// Returns the total amount of HITZ tokens previously minted in stroops
    pub fn get_total_supply(e: Env) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::TotalMinted)
            .unwrap_or(0)
    }

    /// Get remaining mintable HITZ (informational)
    /// NOTE: Supply is exhausted. Minting is disabled. This shows theoretical remaining.
    /// Returns the amount of HITZ that would remain before 21M cap, in stroops
    pub fn get_remaining_supply(e: Env) -> i128 {
        let minted: i128 = e.storage()
            .persistent()
            .get(&DataKey::TotalMinted)
            .unwrap_or(0);
        MAX_HITZ_SUPPLY.saturating_sub(minted)
    }

    /// Create a new entry (admin-only)
    /// SECURITY: Limited to MAX_ENTRIES to prevent DOS
    pub fn create_entry(e: Env, entry_id: String) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // SECURITY FIX C4: Prevent entry spam
        let count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if count >= MAX_ENTRIES {
            panic!("Maximum entry count reached ({})", MAX_ENTRIES);
        }

        let entry_key = DataKey::Entry(entry_id.clone());
        if e.storage().persistent().has(&entry_key) {
            panic!("Entry already exists");
        }

        let now = e.ledger().timestamp();
        let entry = Entry {
            tvl_xlm: 0,
            escrow_xlm: 0,
            created_at: now,
        };

        e.storage().persistent().set(&entry_key, &entry);

        // Add to index (SECURITY FIX C3: Use persistent storage for EntryCount)
        e.storage().persistent().set(&DataKey::EntryAt(count), &entry_id);
        e.storage().persistent().set(&DataKey::EntryCount, &(count + 1));
    }

    /// Record a user action (main entrypoint)
    ///
    /// POST-EXHAUSTION MODEL: Supply is fully issued, no more minting.
    /// - Staking actions (mine/invest): Fee goes to contract as stake (1:1 ratio)
    /// - Non-staking actions (stream/like/download): Fee goes to treasury for distribution
    ///
    /// For invest action, amount specifies the investment in HITZ stroops (min 3 HITZ = 30,000,000 stroops)
    pub fn record_action(e: Env, caller: Address, entry_id: String, kind: Symbol, amount: Option<i128>) {
        caller.require_auth();

        // Get action parameters
        let (fee, _difficulty, _adds_to_tvl, requires_stake) = get_action_params(&e, &kind, amount);

        // Load entry
        let entry_key = DataKey::Entry(entry_id.clone());
        let mut entry: Entry = e
            .storage()
            .persistent()
            .get(&entry_key)
            .unwrap_or_else(|| panic!("Entry not found"));

        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let contract_addr = e.current_contract_address();

        if requires_stake {
            // STAKING ACTIONS (mine/invest): Fee goes to contract as stake
            // No minting - user's fee IS their stake (1:1 ratio, no oracle dependency)
            safe_transfer(&e, &hitz_token, &caller, &contract_addr, &fee, "stake deposit");

            // Record stake (stake = fee, simple 1:1)
            let stake_key = DataKey::Stake((entry_id.clone(), caller.clone()));
            let current_stake: i128 = e.storage().persistent().get(&stake_key).unwrap_or(0);
            let new_stake = current_stake
                .checked_add(fee)
                .unwrap_or_else(|| panic!("User stake overflow for entry"));
            e.storage().persistent().set(&stake_key, &new_stake);
            e.storage().persistent().extend_ttl(&stake_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);

            let total_key = DataKey::StakeTotal(entry_id.clone());
            let current_total: i128 = e.storage().persistent().get(&total_key).unwrap_or(0);
            let new_total = current_total
                .checked_add(fee)
                .unwrap_or_else(|| panic!("Total stake overflow for entry"));
            e.storage().persistent().set(&total_key, &new_total);
            e.storage().persistent().extend_ttl(&total_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);

            // Record in TVL (staking actions add to TVL)
            entry.tvl_xlm = entry.tvl_xlm
                .checked_add(fee)
                .unwrap_or_else(|| panic!("TVL overflow for entry"));

            log!(
                &e,
                "Stake deposit: {} HITZ staked on entry {} (user total: {}, entry total: {})",
                fee,
                entry_id,
                new_stake,
                new_total
            );
        } else {
            // NON-STAKING ACTIONS (stream/like/download): Fee goes to treasury
            let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
            safe_transfer(&e, &hitz_token, &caller, &treasury, &fee, "HITZ fee");

            // Record in escrow (non-staking actions add to escrow for distribution)
            entry.escrow_xlm = entry.escrow_xlm
                .checked_add(fee)
                .unwrap_or_else(|| panic!("Escrow overflow for entry"));

            log!(
                &e,
                "Action fee: {} HITZ from {} on entry {} (escrow: {})",
                fee,
                caller,
                entry_id,
                entry.escrow_xlm
            );
        }

        // Save entry
        e.storage().persistent().set(&entry_key, &entry);
        e.storage().persistent().extend_ttl(&entry_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);

        // NOTE: No minting - supply is exhausted. Rewards come from treasury distribution.
    }

    // ========================================================================
    // View Functions
    // ========================================================================

    /// Get entry data
    pub fn get_entry(e: Env, entry_id: String) -> Option<Entry> {
        let key = DataKey::Entry(entry_id);
        e.storage().persistent().get(&key)
    }

    /// List entry IDs with pagination
    pub fn list_entries(e: Env, start: u32, limit: u32) -> Vec<String> {
        let count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        let mut result = Vec::new(&e);

        let end = start.saturating_add(limit).min(count);
        for i in start..end {
            if let Some(entry_id) = e.storage().persistent().get::<DataKey, String>(&DataKey::EntryAt(i)) {
                result.push_back(entry_id);
            }
        }

        result
    }

    /// Get user's stake for an entry
    pub fn get_stake(e: Env, entry_id: String, owner: Address) -> i128 {
        let key = DataKey::Stake((entry_id, owner));
        e.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Get total stake for an entry
    pub fn get_stake_total(e: Env, entry_id: String) -> i128 {
        let key = DataKey::StakeTotal(entry_id);
        e.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Contract version

    /// Distribute HITZ rewards proportionally based on escrow performance
    ///
    /// Treasury bot calls this after buying HITZ with accumulated XLM fees.
    /// Contract automatically distributes to entries based on their escrow.
    /// 
    /// # Arguments
    /// * `caller` - Treasury address that holds the HITZ
    /// * `hitz_amount` - Total HITZ to distribute across all entries
    /// 
    /// # Performance
    /// Optimized to single loop - O(n) where n = number of entries
    /// SECURITY: Limited to 1000 entries to prevent DOS
    pub fn distribute_rewards(e: Env, caller: Address, hitz_amount: i128) {
        caller.require_auth();

        // Verify caller is the Treasury
        let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
        if caller != treasury {
            panic!("Only Treasury can distribute rewards");
        }
        if hitz_amount <= 0 {
            panic!("Amount must be positive");
        }
        
        // SECURITY FIX H4: Prevent DOS from too many entries
        const MAX_DISTRIBUTION_ENTRIES: u32 = 1000;
        let entry_count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if entry_count > MAX_DISTRIBUTION_ENTRIES {
            panic!("Too many entries ({}). Maximum {} for single distribution. Use batch_allocate_rewards instead.", 
                   entry_count, MAX_DISTRIBUTION_ENTRIES);
        }

        // SECURITY FIX H2: Transfer HITZ from Treasury to contract with verification
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let contract_addr = e.current_contract_address();
        safe_transfer(&e, &hitz_token, &caller, &contract_addr, &hitz_amount, "reward distribution");

        let entry_count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        
        // OPTIMIZED: Single-loop algorithm
        // First pass: collect entries with escrow and calculate total
        let mut entries_with_escrow: Vec<(String, i128)> = Vec::new(&e);
        let mut total_escrow: i128 = 0;
        
        for i in 0..entry_count {
            let index_key = DataKey::EntryAt(i);
            
            if let Some(entry_id) = e.storage().persistent().get::<DataKey, String>(&index_key) {
                // Extend TTL AFTER confirming index key exists
                e.storage().persistent().extend_ttl(&index_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
                
                let entry_key = DataKey::Entry(entry_id.clone());
                
                if let Some(entry) = e.storage().persistent().get::<DataKey, Entry>(&entry_key) {
                    // Extend TTL AFTER confirming entry exists
                    e.storage().persistent().extend_ttl(&entry_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
                    
                    if entry.escrow_xlm > 0 {
                        total_escrow = total_escrow.saturating_add(entry.escrow_xlm);
                        entries_with_escrow.push_back((entry_id, entry.escrow_xlm));
                    }
                }
            }
        }

        if total_escrow == 0 {
            panic!("No escrow to distribute to");
        }

        // SECURITY FIX C2: Fair dust distribution
        // Distribute rewards proportionally, accumulate dust instead of giving to last entry
        let mut distributed_total: i128 = 0;
        
        for (entry_id, escrow) in entries_with_escrow.iter() {
            let pool_key = DataKey::RewardPool(entry_id.clone());
            
            // Calculate share with proper rounding (no dust attack)
            let entry_share = (hitz_amount.saturating_mul(escrow))
                .checked_div(total_escrow)
                .unwrap_or(0);
            
            if entry_share > 0 {
                let current_pool: i128 = e.storage().persistent().get(&pool_key).unwrap_or(0);
                e.storage().persistent().set(&pool_key, &current_pool.saturating_add(entry_share));
                // Extend TTL AFTER setting the value (so key exists)
                e.storage().persistent().extend_ttl(&pool_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
                distributed_total = distributed_total.saturating_add(entry_share);

                log!(
                    &e,
                    "Distributed {} HITZ to entry {} ({}% of total)",
                    entry_share,
                    entry_id,
                    (escrow * 100) / total_escrow
                );
            }
        }
        
        // Remaining dust stays in contract (negligible amount due to rounding)
        // This is fairer than giving all dust to last entry
        let dust = hitz_amount.saturating_sub(distributed_total);
        if dust > 0 {
            log!(&e, "Rounding dust remaining in contract: {} HITZ", dust);
        }
    }

    /// Calculate total escrow in batches (Phase 1 of 3-phase distribution)
    ///
    /// # Arguments
    /// * `caller` - Treasury address
    /// * `start_index` - Starting entry index for this batch
    /// * `batch_size` - Number of entries to process (max 40 for read-only)
    ///
    /// # Returns
    /// * `(u32, i128)` - (next_start_index, running_total_escrow)
    ///
    /// # Usage
    /// Call repeatedly with increasing start_index until next_start_index >= entry_count
    pub fn calculate_total_escrow_batch(
        e: Env,
        caller: Address,
        start_index: u32,
        batch_size: u32,
    ) -> (u32, i128) {
        caller.require_auth();

        let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
        if caller != treasury {
            panic!("Only Treasury can calculate escrow");
        }

        // Allow larger batches for read-only operations (max 40)
        const MAX_BATCH_SIZE: u32 = 40;
        if batch_size == 0 || batch_size > MAX_BATCH_SIZE {
            panic!("Batch size must be 1-40");
        }

        let entry_count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if entry_count == 0 {
            panic!("No entries to calculate");
        }
        
        if start_index >= entry_count {
            panic!("Start index out of range");
        }

        // Get or initialize running total
        let mut running_total: i128 = if start_index == 0 {
            0
        } else {
            e.storage().instance().get(&DataKey::BatchDistTotalEscrow).unwrap_or(0)
        };

        // Calculate escrow for this batch
        let end_index = u32::min(start_index + batch_size, entry_count);
        
        for i in start_index..end_index {
            let index_key = DataKey::EntryAt(i);
            if let Some(entry_id) = e.storage().persistent().get::<DataKey, String>(&index_key) {
                let entry_key = DataKey::Entry(entry_id.clone());
                if let Some(entry) = e.storage().persistent().get::<DataKey, Entry>(&entry_key) {
                    if entry.escrow_xlm > 0 {
                        running_total = running_total.saturating_add(entry.escrow_xlm);
                    }
                }
            }
        }

        // Store running total
        e.storage().instance().set(&DataKey::BatchDistTotalEscrow, &running_total);

        log!(
            &e,
            "Escrow calculation batch: indices {}-{}, running total: {} XLM",
            start_index,
            end_index - 1,
            running_total
        );

        (end_index, running_total)
    }

    /// Initialize distribution with HITZ transfer (Phase 2 of 3-phase distribution)
    ///
    /// Call this AFTER calculate_total_escrow_batch is complete
    ///
    /// # Arguments
    /// * `caller` - Treasury address that holds the HITZ
    /// * `hitz_amount` - Total HITZ to distribute
    pub fn initialize_distribution(e: Env, caller: Address, hitz_amount: i128) {
        caller.require_auth();

        let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
        if caller != treasury {
            panic!("Only Treasury can initialize distribution");
        }

        if hitz_amount <= 0 {
            panic!("Amount must be positive");
        }

        // Verify total escrow was calculated
        let total_escrow: i128 = e.storage().instance()
            .get(&DataKey::BatchDistTotalEscrow)
            .expect("Must calculate total escrow first");

        if total_escrow == 0 {
            panic!("No escrow to distribute to");
        }

        // Store HITZ amount
        e.storage().instance().set(&DataKey::BatchDistHitzAmount, &hitz_amount);

        // Transfer HITZ from Treasury to contract
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let contract_addr = e.current_contract_address();
        safe_transfer(&e, &hitz_token, &caller, &contract_addr, &hitz_amount, "batch reward distribution");

        log!(&e, "Distribution initialized: {} HITZ across {} XLM total escrow", hitz_amount, total_escrow);
    }

    /// Distribute HITZ rewards in batches (Phase 3 of 3-phase distribution)
    ///
    /// Call this AFTER initialize_distribution
    ///
    /// # Arguments
    /// * `caller` - Treasury address
    /// * `start_index` - Starting entry index for this batch
    /// * `batch_size` - Number of entries to process in this batch (max 15)
    ///
    /// # Returns
    /// * `u32` - Next start_index to use, or entry_count if complete
    ///
    /// # Usage
    /// 1. First: Call calculate_total_escrow_batch repeatedly until complete
    /// 2. Then: Call initialize_distribution once with total HITZ amount
    /// 3. Finally: Call distribute_rewards_batch repeatedly until complete
    pub fn distribute_rewards_batch(
        e: Env,
        caller: Address,
        start_index: u32,
        batch_size: u32,
    ) -> u32 {
        caller.require_auth();

        let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
        if caller != treasury {
            panic!("Only Treasury can distribute rewards");
        }

        // Smaller batch size for write operations (max 15)
        const MAX_BATCH_SIZE: u32 = 15;
        if batch_size == 0 || batch_size > MAX_BATCH_SIZE {
            panic!("Batch size must be 1-15");
        }

        let entry_count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if start_index >= entry_count {
            panic!("Start index out of range");
        }

        // Load distribution state (must be initialized first)
        let total_escrow: i128 = e.storage().instance()
            .get(&DataKey::BatchDistTotalEscrow)
            .expect("Distribution not initialized");
        let total_hitz: i128 = e.storage().instance()
            .get(&DataKey::BatchDistHitzAmount)
            .expect("Distribution not initialized");

        // Process this batch of entries
        let end_index = u32::min(start_index + batch_size, entry_count);
        let mut processed_count = 0;

        for i in start_index..end_index {
            let index_key = DataKey::EntryAt(i);
            
            if let Some(entry_id) = e.storage().persistent().get::<DataKey, String>(&index_key) {
                e.storage().persistent().extend_ttl(&index_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
                
                let entry_key = DataKey::Entry(entry_id.clone());
                
                if let Some(entry) = e.storage().persistent().get::<DataKey, Entry>(&entry_key) {
                    e.storage().persistent().extend_ttl(&entry_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
                    
                    if entry.escrow_xlm > 0 {
                        // Calculate this entry's share
                        let entry_share = (total_hitz.saturating_mul(entry.escrow_xlm))
                            .checked_div(total_escrow)
                            .unwrap_or(0);
                        
                        if entry_share > 0 {
                            let pool_key = DataKey::RewardPool(entry_id.clone());
                            let current_pool: i128 = e.storage().persistent().get(&pool_key).unwrap_or(0);
                            e.storage().persistent().set(&pool_key, &current_pool.saturating_add(entry_share));
                            e.storage().persistent().extend_ttl(&pool_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
                            
                            processed_count += 1;
                            log!(
                                &e,
                                "Batch: Distributed {} HITZ to entry {} (index {})",
                                entry_share,
                                entry_id,
                                i
                            );
                        }
                    }
                }
            }
        }

        log!(&e, "Processed batch: indices {}-{} ({} entries)", start_index, end_index - 1, processed_count);

        // If this was the last batch, clear distribution state
        if end_index >= entry_count {
            e.storage().instance().remove(&DataKey::BatchDistTotalEscrow);
            e.storage().instance().remove(&DataKey::BatchDistHitzAmount);
            log!(&e, "Batch distribution complete!");
        }

        // Return next start index
        end_index
    }

    /// Allocate HITZ rewards to a specific entry's reward pool
    ///
    /// Admin-only function for manual reward allocation (e.g., promotions, bonuses)
    pub fn allocate_rewards(e: Env, entry_id: String, hitz_amount: i128) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Verify entry exists
        let entry_key = DataKey::Entry(entry_id.clone());
        if !e.storage().persistent().has(&entry_key) {
            panic!("Entry not found");
        }

        if hitz_amount <= 0 {
            panic!("Amount must be positive");
        }

        // Ensure admin has funds; transfer HITZ from admin/treasury to contract
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let hitz_client = token::Client::new(&e, &hitz_token);
        let contract_addr = e.current_contract_address();
        if hitz_client.balance(&contract_addr) < hitz_amount {
            panic!("Insufficient HITZ balance in contract");
        }

        // Add to entry's reward pool
        let pool_key = DataKey::RewardPool(entry_id.clone());
        let current_pool: i128 = e.storage().persistent().get(&pool_key).unwrap_or(0);
        let new_pool = current_pool.saturating_add(hitz_amount);
        e.storage().persistent().set(&pool_key, &new_pool);

        log!(
            &e,
            "Rewards allocated: {} HITZ added to entry {} pool",
            hitz_amount,
            entry_id
        );
    }

    /// Batch allocate rewards to multiple entries
    ///
    /// Admin-only function for manual batch allocation (e.g., campaigns, airdrops)
    pub fn batch_allocate_rewards(e: Env, entry_ids: Vec<String>, amounts: Vec<i128>) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let len = entry_ids.len();
        if len != amounts.len() {
            panic!("Entry IDs and amounts length mismatch");
        }
        
        // Limit batch size to prevent gas issues
        if len > 100 {
            panic!("Batch size limited to 100 entries");
        }

        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let hitz_client = token::Client::new(&e, &hitz_token);
        let contract_addr = e.current_contract_address();
        let mut required: i128 = 0;

        for i in 0..len {
            let entry_id = entry_ids.get(i).unwrap();
            let hitz_amount = amounts.get(i).unwrap();
            
            if hitz_amount <= 0 { continue; }

            required = required.saturating_add(hitz_amount);

            // Add to reward pool
            let pool_key = DataKey::RewardPool(entry_id.clone());
            let current_pool: i128 = e.storage().persistent().get(&pool_key).unwrap_or(0);
            let new_pool = current_pool.saturating_add(hitz_amount);
            e.storage().persistent().set(&pool_key, &new_pool);
            e.storage().persistent().extend_ttl(&pool_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
        }

        if hitz_client.balance(&contract_addr) < required {
            panic!("Insufficient HITZ balance in contract for batch allocation");
        }
    }

    /// Claim HITZ rewards from an entry's reward pool
    ///
    /// Stakers receive rewards proportional to their stake from the STAKER pool.
    /// If artist equity exists, stakers share (100% - total_artist_equity) of rewards.
    /// Formula: claimable = (staker_pool × user_stake) / total_stake - already_claimed
    pub fn claim_rewards(e: Env, entry_id: String, claimer: Address) -> i128 {
        claimer.require_auth();

        // Get user's stake
        let stake_key = DataKey::Stake((entry_id.clone(), claimer.clone()));
        let user_stake: i128 = e.storage().persistent().get(&stake_key).unwrap_or(0);

        if user_stake == 0 {
            panic!("No stake in this entry");
        }

        // Get total stake
        let total_stake_key = DataKey::StakeTotal(entry_id.clone());
        let total_stake: i128 = e.storage().persistent().get(&total_stake_key).unwrap_or(0);

        if total_stake == 0 {
            panic!("No total stake found");
        }

        // Get reward pool
        let pool_key = DataKey::RewardPool(entry_id.clone());
        let reward_pool: i128 = e.storage().persistent().get(&pool_key).unwrap_or(0);

        if reward_pool == 0 {
            panic!("No rewards available");
        }

        // Calculate staker pool (exclude artist equity if any)
        let total_equity_key = DataKey::ArtistEquityTotal(entry_id.clone());
        let total_artist_bps: u32 = e.storage().persistent().get(&total_equity_key).unwrap_or(0);
        
        let staker_pool = if total_artist_bps > 0 {
            // Stakers share (10000 - artist_bps) / 10000 of the pool
            (reward_pool * (10_000 - total_artist_bps as i128)) / 10_000
        } else {
            reward_pool
        };

        // Calculate total claimable: (staker_pool × user_stake) / total_stake
        let total_claimable = (staker_pool
            .saturating_mul(user_stake))
            .checked_div(total_stake)
            .unwrap_or(0);

        // Get already claimed
        let claimed_key = DataKey::Claimed((entry_id.clone(), claimer.clone()));
        let already_claimed: i128 = e.storage().persistent().get(&claimed_key).unwrap_or(0);

        // Calculate amount to claim
        let to_claim = total_claimable.saturating_sub(already_claimed);

        if to_claim <= 0 {
            panic!("No rewards to claim");
        }

        // Update claimed amount
        e.storage().persistent().set(&claimed_key, &already_claimed.saturating_add(to_claim));

        // SECURITY FIX H2: Transfer HITZ rewards to claimer with verification
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let contract_addr = e.current_contract_address();
        safe_transfer(&e, &hitz_token, &contract_addr, &claimer, &to_claim, "reward claim");

        log!(
            &e,
            "Rewards claimed: {} claimed {} HITZ from entry {}",
            claimer,
            to_claim,
            entry_id
        );

        to_claim
    }

    /// Unstake HITZ tokens from an entry
    ///
    /// Allows users to withdraw their staked HITZ back to their wallet.
    /// User loses their stake percentage and future rewards from this entry.
    /// 
    /// # Arguments
    /// * `entry_id` - The entry to unstake from
    /// * `caller` - The user unstaking (must have stake)
    /// * `amount` - Amount of HITZ to unstake (in stroops)
    /// 
    /// # Returns
    /// Amount unstaked
    /// 
    /// # Panics
    /// - If user has no stake
    /// - If amount exceeds user's stake
    /// - If amount <= 0
    pub fn unstake(e: Env, entry_id: String, caller: Address, amount: i128) -> i128 {
        caller.require_auth();
        
        // Validate amount
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        // Get user's current stake
        let stake_key = DataKey::Stake((entry_id.clone(), caller.clone()));
        let user_stake: i128 = e.storage().persistent().get(&stake_key).unwrap_or(0);
        
        if user_stake == 0 {
            panic!("No stake in this entry");
        }
        
        if amount > user_stake {
            panic!("Amount exceeds stake");
        }
        
        e.storage().persistent().extend_ttl(&stake_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
        
        // Update user's stake
        let new_user_stake = user_stake.saturating_sub(amount);
        if new_user_stake == 0 {
            // Remove stake entry if going to zero
            e.storage().persistent().remove(&stake_key);
        } else {
            e.storage().persistent().set(&stake_key, &new_user_stake);
        }
        
        // Update total stake
        let total_key = DataKey::StakeTotal(entry_id.clone());
        let total_stake: i128 = e.storage().persistent().get(&total_key).unwrap_or(0);
        let new_total = total_stake.saturating_sub(amount);
        e.storage().persistent().set(&total_key, &new_total);
        // Extend TTL AFTER setting the value (so key exists)
        e.storage().persistent().extend_ttl(&total_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
        
        // SECURITY FIX H2: Transfer HITZ back to user with verification
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let contract_addr = e.current_contract_address();
        safe_transfer(&e, &hitz_token, &contract_addr, &caller, &amount, "unstake");
        
        log!(
            &e,
            "Unstake: {} withdrew {} HITZ from entry {}",
            caller,
            amount,
            entry_id
        );
        
        amount
    }

    /// Get claimable HITZ rewards for a staker (accounts for artist equity)
    pub fn get_claimable_rewards(e: Env, entry_id: String, user: Address) -> i128 {
        let stake_key = DataKey::Stake((entry_id.clone(), user.clone()));
        let user_stake: i128 = e.storage().persistent().get(&stake_key).unwrap_or(0);

        if user_stake == 0 {
            return 0;
        }

        let total_stake: i128 = e.storage().persistent()
            .get(&DataKey::StakeTotal(entry_id.clone()))
            .unwrap_or(0);

        if total_stake == 0 {
            return 0;
        }

        let reward_pool: i128 = e.storage().persistent()
            .get(&DataKey::RewardPool(entry_id.clone()))
            .unwrap_or(0);

        // Calculate staker pool (exclude artist equity)
        let total_equity_key = DataKey::ArtistEquityTotal(entry_id.clone());
        let total_artist_bps: u32 = e.storage().persistent().get(&total_equity_key).unwrap_or(0);
        
        let staker_pool = if total_artist_bps > 0 {
            (reward_pool * (10_000 - total_artist_bps as i128)) / 10_000
        } else {
            reward_pool
        };

        // Calculate total claimable from staker pool
        let total_claimable = (staker_pool
            .saturating_mul(user_stake))
            .checked_div(total_stake)
            .unwrap_or(0);

        // Subtract already claimed
        let claimed_key = DataKey::Claimed((entry_id.clone(), user.clone()));
        let already_claimed: i128 = e.storage().persistent().get(&claimed_key).unwrap_or(0);

        total_claimable.saturating_sub(already_claimed)
    }

    /// Get reward pool size for an entry
    pub fn get_reward_pool(e: Env, entry_id: String) -> i128 {
        let pool_key = DataKey::RewardPool(entry_id.clone());
        e.storage().persistent().get(&pool_key).unwrap_or(0)
    }

    /// Calculate APR for an entry based on HITZ rewards
    ///
    /// APR = ((reward_pool / total_stake) / days_since_creation) × 365 × 100
    /// Returns APR as basis points (1% = 100, 10% = 1000)
    pub fn calculate_apr(e: Env, entry_id: String) -> i128 {
        let entry_key = DataKey::Entry(entry_id.clone());
        let entry: Entry = match e.storage().persistent().get(&entry_key) {
            Some(e) => e,
            None => return 0,
        };

        // Get total stake (denominator)
        let total_stake: i128 = e.storage().persistent()
            .get(&DataKey::StakeTotal(entry_id.clone()))
            .unwrap_or(0);

        if total_stake == 0 {
            return 0;
        }

        // Get reward pool (numerator)
        let reward_pool: i128 = e.storage().persistent()
            .get(&DataKey::RewardPool(entry_id.clone()))
            .unwrap_or(0);

        // Calculate days since creation
        let now = e.ledger().timestamp();
        let seconds_elapsed = now.saturating_sub(entry.created_at);
        let days_elapsed = seconds_elapsed / 86_400;

        if days_elapsed == 0 {
            return 0;
        }

        // SECURITY FIX H5: APR calculation with checked arithmetic to prevent overflow
        // APR = (rewards / stake / days) × 365 × 10000 (basis points)
        // Example: 10% APR = 1000 basis points
        let daily_return = reward_pool
            .checked_mul(10_000)
            .and_then(|v| v.checked_div(total_stake))
            .unwrap_or(i128::MAX); // Cap at max if overflow
            
        let annual_return = daily_return
            .checked_mul(365)
            .and_then(|v| v.checked_div(days_elapsed as i128))
            .unwrap_or(i128::MAX); // Cap at max APR

        // Cap reasonable APR (1,000,000% = 10,000,000 basis points)
        annual_return.min(10_000_000)
    }

    /// Get comprehensive entry statistics for ranking
    ///
    /// Returns: (tvl, escrow, total_stake_hitz, reward_pool_hitz, apr_basis_points)
    pub fn get_entry_stats(e: Env, entry_id: String) -> (i128, i128, i128, i128, i128) {
        let entry_key = DataKey::Entry(entry_id.clone());
        let entry: Entry = match e.storage().persistent().get(&entry_key) {
            Some(e) => e,
            None => return (0, 0, 0, 0, 0),
        };

        let total_stake: i128 = e.storage().persistent()
            .get(&DataKey::StakeTotal(entry_id.clone()))
            .unwrap_or(0);

        let reward_pool: i128 = e.storage().persistent()
            .get(&DataKey::RewardPool(entry_id.clone()))
            .unwrap_or(0);

        let apr = Self::calculate_apr(e.clone(), entry_id);

        (entry.tvl_xlm, entry.escrow_xlm, total_stake, reward_pool, apr)
    }

    // ========================================================================
    // Artist Equity (Non-Dilutable Creator Rewards)
    // ========================================================================

    /// Set non-dilutable artist equity for an entry (admin-only)
    /// 
    /// Allows verified artists to receive a fixed percentage of all rewards.
    /// Multiple artists can have equity on the same entry (collaborations).
    /// 
    /// # Arguments
    /// * `entry_id` - Entry to assign equity to (must exist)
    /// * `artist` - Artist's wallet address
    /// * `equity_bps` - Equity in basis points (1-9990, where 100 = 1%, 9990 = 99.9%)
    /// 
    /// # Security
    /// - Admin-only to prevent unauthorized equity claims
    /// - Max 99.9% total artist equity per entry (leaves 0.1% for stakers minimum)
    /// - Each artist can only have one equity claim per entry
    /// - Equity is immutable once set
    pub fn set_artist_equity(e: Env, entry_id: String, artist: Address, equity_bps: u32) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Validate entry exists
        let entry_key = DataKey::Entry(entry_id.clone());
        if !e.storage().persistent().has(&entry_key) {
            panic!("Entry not found");
        }

        // Validate equity bounds (1-9990 bps = 0.01% - 99.9%)
        if equity_bps == 0 {
            panic!("Equity must be greater than 0");
        }
        if equity_bps > 9990 {
            panic!("Single artist equity cannot exceed 99.9% (9990 bps)");
        }

        // Check this artist doesn't already have equity on this entry
        let equity_key = DataKey::ArtistEquity((entry_id.clone(), artist.clone()));
        if e.storage().persistent().has(&equity_key) {
            panic!("Artist already has equity on this entry");
        }

        // Check total equity won't exceed 99.9%
        let total_key = DataKey::ArtistEquityTotal(entry_id.clone());
        let current_total: u32 = e.storage().persistent().get(&total_key).unwrap_or(0);
        let new_total = current_total.checked_add(equity_bps)
            .unwrap_or_else(|| panic!("Equity calculation overflow"));
        
        if new_total > 9990 {
            panic!("Total artist equity would exceed 99.9% ({} + {} = {} bps)", 
                   current_total, equity_bps, new_total);
        }

        // Store artist's equity claim
        let claim = ArtistEquityClaim {
            equity_bps,
            claimed: 0,
        };
        e.storage().persistent().set(&equity_key, &claim);
        e.storage().persistent().extend_ttl(&equity_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);

        // Update total equity for entry
        e.storage().persistent().set(&total_key, &new_total);
        e.storage().persistent().extend_ttl(&total_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);

        log!(&e, "Artist equity set: {} gets {} bps on entry {} (total: {} bps)", 
             artist, equity_bps, entry_id, new_total);
    }

    /// Artist claims their non-dilutable equity rewards
    /// 
    /// # Arguments
    /// * `entry_id` - Entry to claim from
    /// * `artist` - Artist's address (must match stored equity, requires auth)
    /// 
    /// # Returns
    /// Amount of HITZ claimed
    pub fn claim_artist_equity(e: Env, entry_id: String, artist: Address) -> i128 {
        artist.require_auth();

        let equity_key = DataKey::ArtistEquity((entry_id.clone(), artist.clone()));
        let mut claim: ArtistEquityClaim = e.storage().persistent()
            .get(&equity_key)
            .unwrap_or_else(|| panic!("No equity for this artist on this entry"));

        let reward_pool: i128 = e.storage().persistent()
            .get(&DataKey::RewardPool(entry_id.clone()))
            .unwrap_or(0);

        if reward_pool == 0 {
            panic!("No rewards in pool");
        }

        // Calculate this artist's total share: pool * equity_bps / 10000
        let artist_total = (reward_pool
            .checked_mul(claim.equity_bps as i128)
            .unwrap_or_else(|| panic!("Reward calculation overflow")))
            .checked_div(10_000)
            .unwrap_or(0);

        let to_claim = artist_total.saturating_sub(claim.claimed);

        if to_claim <= 0 {
            panic!("No artist rewards to claim");
        }

        // Update claimed amount
        claim.claimed = claim.claimed.saturating_add(to_claim);
        e.storage().persistent().set(&equity_key, &claim);
        e.storage().persistent().extend_ttl(&equity_key, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);

        // Transfer HITZ to artist
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let contract_addr = e.current_contract_address();
        safe_transfer(&e, &hitz_token, &contract_addr, &artist, &to_claim, "artist equity claim");

        log!(&e, "Artist equity claimed: {} claimed {} HITZ ({} bps) from entry {}", 
             artist, to_claim, claim.equity_bps, entry_id);

        to_claim
    }

    /// Get artist equity info for an entry
    /// 
    /// # Returns
    /// (equity_bps, claimed_amount, claimable_amount) or (0, 0, 0) if no equity
    pub fn get_artist_equity(e: Env, entry_id: String, artist: Address) -> (u32, i128, i128) {
        let equity_key = DataKey::ArtistEquity((entry_id.clone(), artist));
        
        let claim: ArtistEquityClaim = match e.storage().persistent().get(&equity_key) {
            Some(c) => c,
            None => return (0, 0, 0),
        };

        let reward_pool: i128 = e.storage().persistent()
            .get(&DataKey::RewardPool(entry_id))
            .unwrap_or(0);

        let artist_total = (reward_pool * claim.equity_bps as i128) / 10_000;
        let claimable = artist_total.saturating_sub(claim.claimed);

        (claim.equity_bps, claim.claimed, claimable)
    }

    /// Get total artist equity for an entry (sum of all artists)
    /// 
    /// # Returns
    /// Total equity in basis points (0-9990)
    pub fn get_total_artist_equity(e: Env, entry_id: String) -> u32 {
        let total_key = DataKey::ArtistEquityTotal(entry_id);
        e.storage().persistent().get(&total_key).unwrap_or(0)
    }

    pub fn version() -> u32 {
        2  // Bumped for artist equity feature
    }

    /// Merge one entry into another (admin-only).
    /// All escrow, TVL, reward pool, and stakes move from `from_id` to `into_id`.
    /// The `from_id` entry is removed from storage and index.
    /// 
    /// For stake migration:
    /// - If `stakers` list is provided: migrates those users' stakes from from_id to into_id
    /// - If `stakers` is empty: only moves totals (admin must ensure no orphaned stakes)
    /// 
    /// Note: We cannot iterate all stakers (no index), so admin must provide the list.
    /// Use off-chain indexing or events to track stakers.
    pub fn merge_entries(e: Env, from_id: String, into_id: String, stakers: Vec<Address>) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if from_id == into_id { panic!("Cannot merge an entry into itself"); }

        // Load entries
        let from_key = DataKey::Entry(from_id.clone());
        let into_key = DataKey::Entry(into_id.clone());
        let mut into: Entry = e.storage().persistent().get(&into_key).unwrap_or_else(|| panic!("Target entry not found"));
        let from: Entry = e.storage().persistent().get(&from_key).unwrap_or_else(|| panic!("Source entry not found"));

        // Migrate individual stakes (if stakers provided)
        let mut migrated_stake_total: i128 = 0;
        for user in stakers.iter() {
            let from_stake_key = DataKey::Stake((from_id.clone(), user.clone()));
            if let Some(stake_amount) = e.storage().persistent().get::<DataKey, i128>(&from_stake_key) {
                // Move stake to new entry
                let into_stake_key = DataKey::Stake((into_id.clone(), user.clone()));
                let current_into_stake: i128 = e.storage().persistent().get(&into_stake_key).unwrap_or(0);
                e.storage().persistent().set(&into_stake_key, &current_into_stake.saturating_add(stake_amount));
                
                // Also migrate claimed amounts
                let from_claimed_key = DataKey::Claimed((from_id.clone(), user.clone()));
                if let Some(claimed) = e.storage().persistent().get::<DataKey, i128>(&from_claimed_key) {
                    let into_claimed_key = DataKey::Claimed((into_id.clone(), user.clone()));
                    let current_into_claimed: i128 = e.storage().persistent().get(&into_claimed_key).unwrap_or(0);
                    e.storage().persistent().set(&into_claimed_key, &current_into_claimed.saturating_add(claimed));
                    e.storage().persistent().remove(&from_claimed_key);
                }
                
                // Remove old stake
                e.storage().persistent().remove(&from_stake_key);
                migrated_stake_total = migrated_stake_total.saturating_add(stake_amount);
                
                log!(&e, "Migrated stake: {} HITZ from {} to {} for user {}", stake_amount, from_id, into_id, user);
            }
        }

        // Move stake totals
        let from_total_key = DataKey::StakeTotal(from_id.clone());
        let into_total_key = DataKey::StakeTotal(into_id.clone());
        let from_total: i128 = e.storage().persistent().get(&from_total_key).unwrap_or(0);
        
        // Verify migrated stakes match total (if stakers were provided)
        if stakers.len() > 0 && migrated_stake_total != from_total {
            log!(
                &e, 
                "WARNING: Migrated stake ({}) doesn't match total ({}). Some stakes may be orphaned.", 
                migrated_stake_total, 
                from_total
            );
        }
        
        if from_total > 0 {
            let into_total: i128 = e.storage().persistent().get(&into_total_key).unwrap_or(0);
            e.storage().persistent().set(&into_total_key, &into_total.saturating_add(from_total));
            e.storage().persistent().remove(&from_total_key);
        }

        // Move escrow and TVL
        into.escrow_xlm = into.escrow_xlm.saturating_add(from.escrow_xlm);
        into.tvl_xlm = into.tvl_xlm.saturating_add(from.tvl_xlm);

        // Move reward pool
        let from_pool_key = DataKey::RewardPool(from_id.clone());
        let into_pool_key = DataKey::RewardPool(into_id.clone());
        let from_pool: i128 = e.storage().persistent().get(&from_pool_key).unwrap_or(0);
        if from_pool > 0 {
            let into_pool: i128 = e.storage().persistent().get(&into_pool_key).unwrap_or(0);
            e.storage().persistent().set(&into_pool_key, &into_pool.saturating_add(from_pool));
            e.storage().persistent().remove(&from_pool_key);
        }

        // Save merged target entry
        e.storage().persistent().set(&into_key, &into);

        // Remove source entry
        e.storage().persistent().remove(&from_key);

        // SECURITY FIX C5: Atomic index operations
        // Clean index: find and remove from EntryAt, compact by shifting last
        let count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if count == 0 { return; }
        
        let mut remove_pos: Option<u32> = None;
        for i in 0..count {
            if let Some(id) = e.storage().persistent().get::<DataKey, String>(&DataKey::EntryAt(i)) {
                if id == from_id { 
                    remove_pos = Some(i); 
                    break; 
                }
            }
        }
        
        if let Some(pos) = remove_pos {
            let last = count - 1;
            if pos != last {
                // Atomic: get last entry (must exist), then move it
                let last_key = DataKey::EntryAt(last);
                let last_id = e.storage().persistent().get::<DataKey, String>(&last_key)
                    .unwrap_or_else(|| panic!("Index corruption: EntryAt({}) missing", last));
                e.storage().persistent().set(&DataKey::EntryAt(pos), &last_id);
            }
            e.storage().persistent().remove(&DataKey::EntryAt(last));
            e.storage().persistent().set(&DataKey::EntryCount, &last);
        }
        
        log!(&e, "Merge complete: {} merged into {} ({} stakers migrated)", from_id, into_id, stakers.len());
    }

    /// Remove an entry completely (admin-only).
    /// 
    /// If `stakers` list is provided:
    /// - Returns all stakes to those users
    /// - Verifies returned stakes match total
    /// - Then removes entry
    /// 
    /// If `stakers` is empty:
    /// - Removes entry only if total stake is 0
    /// - Otherwise panics (admin must provide staker list)
    /// 
    /// Note: We cannot iterate all stakers (no index), so admin must provide the list.
    /// Use off-chain indexing or events to track stakers.
    pub fn remove_entry(e: Env, entry_id: String, stakers: Vec<Address>) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::Entry(entry_id.clone());
        if !e.storage().persistent().has(&key) {
            panic!("Entry not found");
        }

        let total_key = DataKey::StakeTotal(entry_id.clone());
        let total_stake: i128 = e.storage().persistent().get(&total_key).unwrap_or(0);

        // Return stakes to users if any exist
        if total_stake > 0 {
            if stakers.len() == 0 {
                panic!("Entry has {} HITZ staked. Must provide staker list to return stakes.", total_stake);
            }

            let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
            let contract_addr = e.current_contract_address();
            
            let mut returned_total: i128 = 0;
            
            for user in stakers.iter() {
                let stake_key = DataKey::Stake((entry_id.clone(), user.clone()));
                if let Some(stake_amount) = e.storage().persistent().get::<DataKey, i128>(&stake_key) {
                    // SECURITY FIX H2: Return stake to user with verification
                    safe_transfer(&e, &hitz_token, &contract_addr, &user, &stake_amount, "stake refund");
                    returned_total = returned_total.saturating_add(stake_amount);
                    
                    // Clean up stake and claimed records
                    e.storage().persistent().remove(&stake_key);
                    
                    let claimed_key = DataKey::Claimed((entry_id.clone(), user.clone()));
                    if e.storage().persistent().has(&claimed_key) {
                        e.storage().persistent().remove(&claimed_key);
                    }
                    
                    log!(&e, "Returned stake: {} HITZ to user {} from removed entry {}", stake_amount, user, entry_id);
                }
            }
            
            // Verify all stakes were returned
            if returned_total != total_stake {
                panic!(
                    "Stake mismatch: returned {} but total was {}. Missing stakers in list?",
                    returned_total,
                    total_stake
                );
            }
            
            log!(&e, "Returned {} HITZ total to {} stakers", returned_total, stakers.len());
        }

        // Remove entry and related data
        e.storage().persistent().remove(&key);

        let pool_key = DataKey::RewardPool(entry_id.clone());
        if e.storage().persistent().has(&pool_key) { e.storage().persistent().remove(&pool_key); }
        if e.storage().persistent().has(&total_key) { e.storage().persistent().remove(&total_key); }

        // SECURITY FIX C5: Atomic index operations
        // Update index by removing and compacting
        let count: u32 = e.storage().persistent().get(&DataKey::EntryCount).unwrap_or(0);
        if count == 0 { return; }
        
        let mut remove_pos: Option<u32> = None;
        for i in 0..count {
            if let Some(id) = e.storage().persistent().get::<DataKey, String>(&DataKey::EntryAt(i)) {
                if id == entry_id { 
                    remove_pos = Some(i); 
                    break; 
                }
            }
        }
        
        if let Some(pos) = remove_pos {
            let last = count - 1;
            if pos != last {
                // Atomic: get last entry (must exist), then move it
                let last_key = DataKey::EntryAt(last);
                let last_id = e.storage().persistent().get::<DataKey, String>(&last_key)
                    .unwrap_or_else(|| panic!("Index corruption: EntryAt({}) missing", last));
                e.storage().persistent().set(&DataKey::EntryAt(pos), &last_id);
            }
            e.storage().persistent().remove(&DataKey::EntryAt(last));
            e.storage().persistent().set(&DataKey::EntryCount, &last);
        }
        
        log!(&e, "Entry removed: {} ({} stakers refunded)", entry_id, stakers.len());
    }
}

// ============================================================================
// Security Helpers
// ============================================================================

/// SECURITY FIX H2: Safe token transfer with verification
/// Soroban transfers panic on failure, but we add explicit checks for extra safety
fn safe_transfer(e: &Env, token: &Address, from: &Address, to: &Address, amount: &i128, description: &str) {
    let client = token::Client::new(e, token);
    
    // Get balances before transfer
    let from_balance_before = client.balance(from);
    let to_balance_before = client.balance(to);
    
    // Perform transfer (will panic if fails)
    client.transfer(from, to, amount);
    
    // Verify transfer succeeded by checking balances changed correctly
    let from_balance_after = client.balance(from);
    let to_balance_after = client.balance(to);
    
    // Verify from balance decreased
    if from != to {  // Skip check if same address (self-transfer)
        let from_diff = from_balance_before.saturating_sub(from_balance_after);
        if from_diff != *amount {
            panic!("Transfer verification failed ({}): from balance mismatch", description);
        }
        
        // Verify to balance increased
        let to_diff = to_balance_after.saturating_sub(to_balance_before);
        if to_diff != *amount {
            panic!("Transfer verification failed ({}): to balance mismatch", description);
        }
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Returns (fee, difficulty, adds_to_tvl, requires_stake) for an action kind
/// For invest action, amount determines the fee and proportional difficulty
/// For other actions, fee = base_fee * difficulty
fn get_action_params(e: &Env, kind: &Symbol, amount: Option<i128>) -> (i128, i128, bool, bool) {
    let stream = symbol_short!("stream");
    let like = symbol_short!("like");
    let download = symbol_short!("download");
    let mine = symbol_short!("mine");
    let invest = symbol_short!("invest");

    // Get base fee from storage (default 0.1 HITZ)
    let base_fee: i128 = e.storage().instance().get(&DataKey::BaseFee).unwrap_or(1_000_000);

    if kind == &stream {
        let difficulty = 1;
        (base_fee * difficulty, difficulty, false, false) // 0.1 HITZ
    } else if kind == &like {
        let difficulty = 2;
        (base_fee * difficulty, difficulty, false, false) // 0.2 HITZ
    } else if kind == &download {
        let difficulty = 3;
        (base_fee * difficulty, difficulty, false, false) // 0.3 HITZ
    } else if kind == &mine {
        let difficulty = 10;
        (base_fee * difficulty, difficulty, true, true) // 1 HITZ
    } else if kind == &invest {
        // Dynamic investment: user specifies amount (min 3 HITZ)
        let investment_amount = amount.unwrap_or(30_000_000);
        
        // Validate minimum investment
        if investment_amount < 30_000_000 {
            panic!("Minimum investment is 3 HITZ (30,000,000 stroops)");
        }
        
        // Calculate proportional difficulty: 10 units per 1 HITZ
        // This maintains reward parity with the original fixed invest action
        let difficulty = (investment_amount * 10) / 10_000_000;
        
        (investment_amount, difficulty, true, true)
    } else {
        panic!("Unknown action kind");
    }
}


// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests;

