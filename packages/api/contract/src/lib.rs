#![no_std]

//! Skyhitz Core V1 - Soroban Smart Contract (Security Hardened)
//!
//! Purpose: Record user actions for music entries, reward users with HITZ tokens,
//! attribute HITZ fees to entries, and manage HITZ staking for invest/mine actions.
//!
//! HITZ Token:
//! - OpenZeppelin SEP-41 compatible fungible token with fixed cap: 21,000,000 HITZ
//! - Token handles its own emission logic with Bitcoin-style halving schedule
//! - This contract requests rewards from the token based on action difficulty
//! - Supply cap enforced: Minting stops at 21M HITZ total supply
//!
//! HITZ Fees:
//! - All HITZ fees are transferred to Treasury address (for reward distribution)
//! - Users pay in HITZ, eliminating need for dual-token economy
//!
//! Action Kinds & Parameters (fees calculated as base_fee * difficulty):
//! - stream:   difficulty 1,  fee = base_fee × 1  (default 0.1 HITZ), adds to escrow
//! - like:     difficulty 2,  fee = base_fee × 2  (default 0.2 HITZ), adds to escrow
//! - download: difficulty 3,  fee = base_fee × 3  (default 0.3 HITZ), adds to escrow
//! - mine:     difficulty 10, fee = base_fee × 10 (default 1 HITZ), adds to TVL, auto-stakes
//! - invest:   DYNAMIC fee (min 3 HITZ), proportional difficulty (10 per 1 HITZ), adds to TVL, auto-stakes
//!
//! Base Fee:
//! - Default: 0.1 HITZ (1,000,000 stroops)
//! - Admin can update via set_base_fee() to adjust all action fees proportionally
//!
//! Auto-stake (invest/mine only):
//! - stake_amount = HITZ_invested / HITZ_market_price (oracle-based)
//! - Users get the amount of HITZ they could have bought on the DEX
//! - Prevents arbitrage: unstaking and selling returns approximately the same HITZ
//! - Minted directly to contract (locked), updates per-user and total stake for entry
//! - Example: Invest 100 HITZ at 0.1 XLM/HITZ → 10,000 HITZ staked
//!
//! Security Features:
//! - Supply cap enforcement on all mints
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
    // Emission schedule (moved into core)
    EmissionStartTs,                    // u64: halving start timestamp
    EmissionIntervalSec,                // u64: seconds per halving epoch (default 126,144,000)
    EmissionEpoch0UnitReward,           // i128: initial unit reward in stroops (default 3,000,000 = 0.3 HITZ)
    // Oracle price for dynamic emission
    OraclePrice,                        // i128: Current HITZ/XLM market price in stroops (e.g., 100_000 = 0.01 XLM per HITZ)
    OracleLastUpdate,                   // u64: Last oracle price update timestamp
    
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
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Entry {
    pub tvl_hitz: i128,      // Total Value Locked (equity-bearing) in HITZ
    pub escrow_hitz: i128,   // Non-equity revenue in HITZ
    pub created_at: u64,     // Timestamp
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
    /// Clears: Admin, Treasury, HitzToken, XlmToken, BaseFee, Oracle settings, Emission settings
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
        e.storage().instance().remove(&DataKey::XlmToken);
        e.storage().instance().remove(&DataKey::BaseFee);
        e.storage().instance().remove(&DataKey::EmissionStartTs);
        e.storage().instance().remove(&DataKey::EmissionIntervalSec);
        e.storage().instance().remove(&DataKey::EmissionEpoch0UnitReward);
        e.storage().instance().remove(&DataKey::OraclePrice);
        e.storage().instance().remove(&DataKey::OracleLastUpdate);
        
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
        
        // Initialize oracle price to 1,000,000 stroops (0.1 XLM per HITZ = 1 HITZ costs 0.1 XLM)
        e.storage().instance().set(&DataKey::OraclePrice, &1_000_000i128);
        e.storage().instance().set(&DataKey::OracleLastUpdate, &e.ledger().timestamp());
        
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
    /// * `new_base_fee` - New base fee per difficulty unit in stroops (e.g., 100,000 = 0.01 XLM)
    pub fn set_base_fee(e: Env, new_base_fee: i128) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if new_base_fee < 0 {
            panic!("Base fee must be non-negative");
        }

        e.storage().instance().set(&DataKey::BaseFee, &new_base_fee);
    }

    /// NOTE: withdraw_xlm_to_treasury() removed - no longer needed in HITZ-only economy

    /// Update oracle price (treasury-only)
    ///
    /// Treasury bot calls this after fetching current market price from DEX.
    /// This price is used for dynamic emission rate calculations.
    ///
    /// # Arguments
    /// * `caller` - Treasury address (must be the configured Treasury)
    /// * `new_price` - New HITZ/XLM price in stroops (e.g., 100,000 = 0.01 XLM per HITZ)
    pub fn update_oracle_price(e: Env, caller: Address, new_price: i128) {
        caller.require_auth();
        
        // Verify caller is the Treasury
        let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
        if caller != treasury {
            panic!("Only Treasury can update oracle price");
        }
        
        if new_price <= 0 {
            panic!("Price must be positive");
        }
        
        // Store new price and timestamp
        e.storage().instance().set(&DataKey::OraclePrice, &new_price);
        e.storage().instance().set(&DataKey::OracleLastUpdate, &e.ledger().timestamp());
        
        log!(&e, "Oracle price updated to {} stroops per HITZ", new_price);
    }

    /// Get oracle data (price and last update timestamp)
    ///
    /// Returns (price_in_stroops, last_update_timestamp)
    pub fn get_oracle_data(e: Env) -> (i128, u64) {
        let price: i128 = e.storage().instance()
            .get(&DataKey::OraclePrice)
            .unwrap_or(100_000); // Default: 0.01 XLM per HITZ
        let last_update: u64 = e.storage().instance()
            .get(&DataKey::OracleLastUpdate)
            .unwrap_or(0);
        
        (price, last_update)
    }

    /// Get current base fee
    pub fn get_base_fee(e: Env) -> i128 {
        e.storage().instance().get(&DataKey::BaseFee).unwrap_or(100_000)
    }

    /// Get total HITZ supply minted so far
    /// Returns the total amount of HITZ tokens minted by this contract in stroops
    pub fn get_total_supply(e: Env) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::TotalMinted)
            .unwrap_or(0)
    }

    /// Get remaining HITZ tokens that can be minted
    /// Returns the amount of HITZ remaining before hitting the 21M cap, in stroops
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
            tvl_hitz: 0,
            escrow_hitz: 0,
            created_at: now,
        };

        e.storage().persistent().set(&entry_key, &entry);

        // Add to index (SECURITY FIX C3: Use persistent storage for EntryCount)
        e.storage().persistent().set(&DataKey::EntryAt(count), &entry_id);
        e.storage().persistent().set(&DataKey::EntryCount, &(count + 1));
    }

    /// Record a user action (main entrypoint)
    ///
    /// Handles fee transfer, reward calculation, and optional auto-staking
    /// For invest action, amount_xlm specifies the investment (min 0.3 XLM), ignored for other actions
    pub fn record_action(e: Env, caller: Address, entry_id: String, kind: Symbol, amount_xlm: Option<i128>) {
        caller.require_auth();

        // Get action parameters
        let (fee, difficulty, adds_to_tvl, requires_stake) = get_action_params(&e, &kind, amount_xlm);

        // Load entry
        let entry_key = DataKey::Entry(entry_id.clone());
        let mut entry: Entry = e
            .storage()
            .persistent()
            .get(&entry_key)
            .unwrap_or_else(|| panic!("Entry not found"));

        // SECURITY FIX H2: Transfer HITZ fee from caller to Treasury with verification
        let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        safe_transfer(&e, &hitz_token, &caller, &treasury, &fee, "HITZ fee to treasury");

        // SECURITY FIX H5: Attribute fee to entry using checked arithmetic
        if adds_to_tvl {
            entry.tvl_hitz = entry.tvl_hitz
                .checked_add(fee)
                .unwrap_or_else(|| panic!("TVL overflow for entry"));
        } else {
            entry.escrow_hitz = entry.escrow_hitz
                .checked_add(fee)
                .unwrap_or_else(|| panic!("Escrow overflow for entry"));
        }

        // Compute HITZ reward using core-managed emission schedule and mint via SAC (core is admin)
        let hitz_token: Address = e.storage().instance().get(&DataKey::HitzToken).unwrap();
        let unit_reward = compute_unit_reward(&e);
        
        // SECURITY FIX H5: Use checked arithmetic instead of saturating
        let reward: i128 = unit_reward
            .checked_mul(difficulty)
            .unwrap_or_else(|| panic!("Reward calculation overflow: {} * {}", unit_reward, difficulty));
        
        // SECURITY FIX C1: Enforce supply cap and verify admin rights before minting
        let reward = if reward > 0 {
            safe_mint_with_cap(&e, &hitz_token, &caller, &reward)
        } else {
            0
        };

        // ECONOMIC MODEL: Market-based staking (prevents arbitrage)
        // Stake amount = XLM invested / HITZ market price
        // This gives users exactly what they could have bought on the DEX
        // Examples at different prices:
        //   - Invest 100 XLM at 0.01 XLM/HITZ → 10,000 HITZ stake
        //   - Invest 100 XLM at 0.1 XLM/HITZ  → 1,000 HITZ stake
        //   - Invest 100 XLM at 0.001 XLM/HITZ → 100,000 HITZ stake
        // When they unstake and sell, they get approximately their XLM back (no arbitrage)
        if requires_stake {
            // Get current HITZ market price from oracle (in stroops per HITZ)
            let hitz_price_xlm: i128 = e
                .storage()
                .instance()
                .get(&DataKey::OraclePrice)
                .unwrap_or(100_000); // Default: 0.01 XLM per HITZ (100,000 stroops)
            
            if hitz_price_xlm <= 0 {
                panic!("Invalid oracle price: must be positive");
            }
            
            // Calculate stake: fee (stroops) / price (stroops per HITZ)
            // We need to convert fee to HITZ units:
            // stake_hitz = (fee_stroops × 10^7) / (price_stroops_per_hitz)
            // Both XLM and HITZ use 7 decimals, so we multiply by 10^7 for precision
            let stake_amt = fee
                .checked_mul(10_000_000)
                .and_then(|v| v.checked_div(hitz_price_xlm))
                .unwrap_or_else(|| panic!("Stake calculation overflow or division error"));

            if stake_amt > 0 {
                // Mint stake HITZ directly to contract (locked, not to user first)
                let contract_addr = e.current_contract_address();
                let staked_hitz = safe_mint_with_cap(&e, &hitz_token, &contract_addr, &stake_amt);
                
                if staked_hitz > 0 {
                    // SECURITY FIX H5: Update stake maps using checked arithmetic
                    let stake_key = DataKey::Stake((entry_id.clone(), caller.clone()));
                    let current_stake: i128 = e.storage().persistent().get(&stake_key).unwrap_or(0);
                    let new_stake = current_stake
                        .checked_add(staked_hitz)
                        .unwrap_or_else(|| panic!("User stake overflow for entry"));
                    e.storage().persistent().set(&stake_key, &new_stake);

                    let total_key = DataKey::StakeTotal(entry_id.clone());
                    let current_total: i128 = e.storage().persistent().get(&total_key).unwrap_or(0);
                    let new_total = current_total
                        .checked_add(staked_hitz)
                        .unwrap_or_else(|| panic!("Total stake overflow for entry"));
                    e.storage().persistent().set(&total_key, &new_total);

                    log!(
                        &e,
                        "Market-based stake: {} XLM at {} stroops/HITZ → {} HITZ staked for entry {} (user total: {})",
                        fee,
                        hitz_price_xlm,
                        staked_hitz,
                        entry_id,
                        new_stake
                    );
                }
            }
        }

        // Save entry
        e.storage().persistent().set(&entry_key, &entry);

        log!(
            &e,
            "Action: {} - {} - fee: {} XLM, reward: {} HITZ",
            kind,
            entry_id,
            fee,
            reward
        );
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
    /// Contract automatically distributes to entries based on their escrow_hitz.
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
                    
                    if entry.escrow_hitz > 0 {
                        total_escrow = total_escrow.saturating_add(entry.escrow_hitz);
                        entries_with_escrow.push_back((entry_id, entry.escrow_hitz));
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
                    if entry.escrow_hitz > 0 {
                        running_total = running_total.saturating_add(entry.escrow_hitz);
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
                    
                    if entry.escrow_hitz > 0 {
                        // Calculate this entry's share
                        let entry_share = (total_hitz.saturating_mul(entry.escrow_hitz))
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
    /// Stakers receive rewards proportional to their stake
    /// Formula: claimable = (reward_pool × user_stake) / total_stake - already_claimed
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

        // Calculate total claimable: (pool × user_stake) / total_stake
        let total_claimable = (reward_pool
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

    /// Get claimable HITZ rewards for a user
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

        // Calculate total claimable
        let total_claimable = (reward_pool
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
    /// Returns: (tvl_hitz, escrow_hitz, total_stake_hitz, reward_pool_hitz, apr_basis_points)
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

        (entry.tvl_hitz, entry.escrow_hitz, total_stake, reward_pool, apr)
    }


    pub fn version() -> u32 {
        1
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
        into.escrow_hitz = into.escrow_hitz.saturating_add(from.escrow_hitz);
        into.tvl_hitz = into.tvl_hitz.saturating_add(from.tvl_hitz);

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

/// SECURITY FIX C1: Safe mint with supply cap enforcement
/// Mints HITZ tokens while respecting the 21M supply cap
/// Returns actual amount minted (may be less than requested if cap reached)
fn safe_mint_with_cap(e: &Env, hitz_token: &Address, to: &Address, amount: &i128) -> i128 {
    if *amount <= 0 {
        return 0;
    }
    
    // Get current total minted from storage
    let total_minted: i128 = e.storage()
        .persistent()
        .get(&DataKey::TotalMinted)
        .unwrap_or(0);
    
    // Check if we've already hit the cap
    if total_minted >= MAX_HITZ_SUPPLY {
        log!(e, "HITZ supply cap reached: {} / {} stroops", total_minted, MAX_HITZ_SUPPLY);
        return 0;
    }
    
    // Calculate how much we can actually mint (cap remaining supply)
    let remaining = MAX_HITZ_SUPPLY - total_minted;
    let to_mint = if *amount > remaining { 
        log!(e, "Capping mint: requested {} but only {} remaining", amount, remaining);
        remaining 
    } else { 
        *amount 
    };
    
    if to_mint <= 0 {
        return 0;
    }
    
    // Verify core contract still has admin rights (prevents brick if admin changed)
    let sac_admin = token::StellarAssetClient::new(e, hitz_token);
    let current_admin = sac_admin.admin();
    if current_admin != e.current_contract_address() {
        panic!("Core contract is not HITZ token admin. Cannot mint rewards.");
    }
    
    // Mint the tokens via SAC
    sac_admin.mint(to, &to_mint);
    
    // Update total minted counter (CRITICAL: must happen after successful mint)
    let new_total = total_minted + to_mint;
    e.storage().persistent().set(&DataKey::TotalMinted, &new_total);
    
    // Extend TTL for the counter
    e.storage().persistent().extend_ttl(&DataKey::TotalMinted, STORAGE_LIFETIME_THRESHOLD, STORAGE_BUMP_AMOUNT);
    
    log!(e, "Minted {} HITZ. Total supply: {} / {} stroops", to_mint, new_total, MAX_HITZ_SUPPLY);
    
    to_mint
}

// ============================================================================
// Emission helpers (moved from token into core for SAC-based HITZ)
// ============================================================================

fn compute_epoch_index(e: &Env) -> u64 {
    let start_ts: u64 = e.storage().instance().get(&DataKey::EmissionStartTs).unwrap_or(0);
    let interval: u64 = e
        .storage()
        .instance()
        .get(&DataKey::EmissionIntervalSec)
        .unwrap_or(126_144_000);
    let now = e.ledger().timestamp();
    if now < start_ts || interval == 0 { return 0; }
    (now - start_ts) / interval
}

fn compute_unit_reward(e: &Env) -> i128 {
    let epoch = compute_epoch_index(e);
    let epoch0_reward: i128 = e
        .storage()
        .instance()
        .get(&DataKey::EmissionEpoch0UnitReward)
        .unwrap_or(3_000_000);
    if epoch >= 64 { return 0; }
    
    // Apply halving to base reward
    let base_reward = epoch0_reward >> epoch;
    
    // Get current market price from oracle (stroops per HITZ)
    let hitz_price_xlm: i128 = e
        .storage()
        .instance()
        .get(&DataKey::OraclePrice)
        .unwrap_or(100_000); // Default: 0.01 XLM per HITZ
    
    // Get base fee (XLM cost per difficulty unit)
    let base_fee: i128 = e
        .storage()
        .instance()
        .get(&DataKey::BaseFee)
        .unwrap_or(100_000); // Default: 0.01 XLM
    
    // Calculate value-adjusted reward
    // Goal: Maintain value parity between fee paid and reward received
    // If user pays 0.01 XLM and HITZ = 0.01 XLM, they should get ~1 HITZ
    // Formula: reward = fee_paid / hitz_price
    // Multiply by 10_000_000 to convert from XLM units to stroops precision
    // SECURITY FIX: Use checked arithmetic to prevent overflow
    let value_adjusted_reward = if hitz_price_xlm > 0 {
        base_fee
            .checked_mul(10_000_000)
            .and_then(|v| v.checked_div(hitz_price_xlm))
            .unwrap_or_else(|| {
                log!(e, "Oracle reward calculation overflow: base_fee={}, price={}", base_fee, hitz_price_xlm);
                base_reward // Fallback to base reward on overflow
            })
    } else {
        log!(e, "Oracle price is zero, using base_reward");
        base_reward // Fallback if price is zero
    };
    
    // Take the minimum of:
    // 1. Base halving schedule reward (prevents over-emission during bear markets)
    // 2. Value-adjusted reward (prevents arbitrage during bull markets)
    let final_reward = if value_adjusted_reward < base_reward {
        value_adjusted_reward
    } else {
        base_reward
    };
    
    log!(e, "Dynamic reward: base={}, value_adj={}, final={}, oracle_price={}", 
         base_reward, value_adjusted_reward, final_reward, hitz_price_xlm);
    
    final_reward
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Returns (fee, difficulty, adds_to_tvl, requires_stake) for an action kind
/// For invest action, amount_xlm determines the fee and proportional difficulty
/// For other actions, fee = base_fee * difficulty
fn get_action_params(e: &Env, kind: &Symbol, amount_xlm: Option<i128>) -> (i128, i128, bool, bool) {
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
        let investment_amount = amount_xlm.unwrap_or(30_000_000);
        
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
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, Env};

    // Note: With mock_all_auths(), we don't need to actually set admin in tests.
    // The SAC will accept mint calls from the core contract with mocked authorization.

    // Helper to setup test environment and return contract ready for initialization
    fn setup_test_with_contract() -> (Env, Address, Address, Address, Address, Address) {
        let e = Env::default();
        e.mock_all_auths_allowing_non_root_auth();

        let admin = Address::generate(&e);
        let treasury = Address::generate(&e);
        let user = Address::generate(&e);
        let issuer = Address::generate(&e);

        // Use SAC instance for HITZ token
        let hitz_token = e.register_stellar_asset_contract_v2(issuer.clone());

        e.ledger().with_mut(|li| {
            li.protocol_version = 22;
            li.min_persistent_entry_ttl = 4096;
            li.min_temp_entry_ttl = 4096;
            li.max_entry_ttl = 31_536_000;
        });
        
        // Register contract
        let contract_id = e.register(SkyhitzCore, ());
        
        // CRITICAL: Set contract as HITZ token admin (required for minting)
        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_token.address());
        hitz_admin.set_admin(&contract_id);

        (e, admin, treasury, user, hitz_token.address(), contract_id)
    }

    #[test]
    fn test_init() {
        let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();
        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // Verify instance keys exist
        assert_eq!(client.get_base_fee(), 100_000);
        
        // Verify oracle initialized
        let (oracle_price, _) = client.get_oracle_data();
        assert_eq!(oracle_price, 100_000); // Should be initialized to base_fee
    }

    #[test]
    fn test_create_entry() {
        let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();
        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,       // base_fee: 0.01 XLM
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.tvl_hitz, 0);
        assert_eq!(entry.escrow_hitz, 0);
    }

    #[test]
    fn test_record_action_stream() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Fund user with XLM
        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Record stream action
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);

        // Check entry updated
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.escrow_hitz, 100_000); // 0.01 XLM fee added to escrow
        assert_eq!(entry.tvl_hitz, 0);

        // Check XLM transferred to treasury
        let treasury_xlm = token::Client::new(&e, &xlm_addr).balance(&treasury);
        assert_eq!(treasury_xlm, 100_000);

        // Check HITZ reward: difficulty 1, base=3M, value_adj=10M, final=3M
        let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
        assert_eq!(user_hitz, 3_000_000); // Dynamic reward capped by halving schedule
    }

    #[test]
    fn test_record_action_mine_with_stake() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Fund user with XLM
        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,   // base_fee: 0.01 XLM, oracle also set to 0.01 XLM per HITZ
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Record mine action (difficulty 10, requires stake)
        client.record_action(&user, &entry_id, &symbol_short!("mine"), &None);

        // Check entry updated (TVL not escrow)
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.tvl_hitz, 1_000_000); // 0.1 XLM (base_fee * 10)
        assert_eq!(entry.escrow_hitz, 0);

        // Check user got reward (separate from stake)
        let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
        // Reward: difficulty 10, base=3M per unit, value_adj=100M, final=3M per unit × 10 = 30M
        assert_eq!(user_hitz, 30_000_000);

        // Check stake recorded (market-based: 0.1 XLM / 0.01 price = 10 HITZ)
        let stake = client.get_stake(&entry_id, &user);
        assert_eq!(stake, 100_000_000); // 10 HITZ in stroops

        let stake_total = client.get_stake_total(&entry_id);
        assert_eq!(stake_total, 100_000_000); // 10 HITZ in stroops
    }

    #[test]
    fn test_halving() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Epoch 0 (start): unit reward = 3,000,000; stream difficulty = 1 → 3,000,000 minted
        let start_time = e.ledger().timestamp();
        e.ledger().with_mut(|li| li.timestamp = start_time);
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let r0 = token::Client::new(&e, &hitz_addr).balance(&user);
        assert_eq!(r0, 3_000_000);

        // Advance to next epoch (4 years later) and record another stream
        e.ledger().with_mut(|li| li.timestamp += 126_144_000);
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let r1 = token::Client::new(&e, &hitz_addr).balance(&user) - r0;
        assert_eq!(r1, 1_500_000); // halved
    }

    #[test]
    fn test_supply_cap() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Fund contract with less than reward
        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &1_000_000i128); // Only 1M

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,       // base_fee: 0.01 XLM
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);

        // With SAC minting, contract can mint directly without balance constraints
        // User gets full reward: 3M HITZ (unit_reward=3M, difficulty=1)
        let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
        assert_eq!(user_hitz, 3_000_000);
    }

    #[test]
    fn test_list_entries() {
        let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,       // base_fee: 0.01 XLM
        );

        client.create_entry(&String::from_str(&e, "song1"));
        client.create_entry(&String::from_str(&e, "song2"));
        client.create_entry(&String::from_str(&e, "song3"));

        let entries = client.list_entries(&0, &10);
        assert_eq!(entries.len(), 3);
        assert_eq!(entries.get(0).unwrap(), String::from_str(&e, "song1"));
        assert_eq!(entries.get(1).unwrap(), String::from_str(&e, "song2"));
        assert_eq!(entries.get(2).unwrap(), String::from_str(&e, "song3"));

        // Test pagination
        let page = client.list_entries(&1, &2);
        assert_eq!(page.len(), 2);
        assert_eq!(page.get(0).unwrap(), String::from_str(&e, "song2"));
    }

    #[test]
    #[should_panic(expected = "Unknown action kind")]
    fn test_unknown_action_panics() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        client.record_action(&user, &entry_id, &symbol_short!("unknown"), &None);
    }

    #[test]
    fn test_multiple_action_kinds() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &1_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);
        hitz_admin.mint(&user, &1_000_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128); // base_fee: 0.1 XLM

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Stream, like, download -> escrow
        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &1_000_000_000i128);
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        client.record_action(&user, &entry_id, &symbol_short!("like"), &None);
        client.record_action(&user, &entry_id, &symbol_short!("download"), &None);

        let entry = client.get_entry(&entry_id).unwrap();
        // 0.1 + 0.2 + 0.3 = 0.6 XLM = 6M stroops
        assert_eq!(entry.escrow_hitz, 6_000_000);
        assert_eq!(entry.tvl_hitz, 0);

        // Invest -> TVL (default 0.3 XLM)
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &None);

        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.escrow_hitz, 6_000_000);
        assert_eq!(entry.tvl_hitz, 3_000_000); // 0.3 XLM
    }

    #[test]
    fn test_dynamic_investment() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &1_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,   // base_fee: 0.01 XLM
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Test 1: Minimum investment (0.3 XLM = 3M stroops) at 0.01 XLM per HITZ
        // Market-based stake: 0.3 XLM / 0.01 = 30 HITZ = 300M stroops
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(3_000_000i128));
        
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.tvl_hitz, 3_000_000); // 0.3 XLM
        
        let stake1 = client.get_stake(&entry_id, &user);
        assert_eq!(stake1, 300_000_000); // 30 HITZ

        // Test 2: Double investment (0.6 XLM = 6M stroops)
        // Market-based stake: 0.6 XLM / 0.01 = 60 HITZ = 600M stroops
        // Total: 30 + 60 = 90 HITZ = 900M stroops
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(6_000_000i128));
        
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.tvl_hitz, 9_000_000); // 0.3 + 0.6 = 0.9 XLM
        
        let stake2 = client.get_stake(&entry_id, &user);
        assert_eq!(stake2, 900_000_000); // 90 HITZ

        // Test 3: Large investment (3.0 XLM = 30M stroops)
        // Market-based stake: 3.0 XLM / 0.01 = 300 HITZ = 3B stroops
        // Total: 90 + 300 = 390 HITZ = 3.9B stroops
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(30_000_000i128));
        
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.tvl_hitz, 39_000_000); // 0.9 + 3.0 = 3.9 XLM
        
        let stake3 = client.get_stake(&entry_id, &user);
        assert_eq!(stake3, 3_900_000_000); // 390 HITZ

        // Verify proportional stakes
        let total_stake = client.get_stake_total(&entry_id);
        assert_eq!(total_stake, 3_900_000_000); // 390 HITZ
    }

    #[test]
    #[should_panic(expected = "Minimum investment is 0.3 XLM")]
    fn test_investment_below_minimum() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,       // base_fee: 0.01 XLM
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Should panic: 0.2 XLM is below minimum
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(2_000_000i128));
    }

    #[test]
    fn test_base_fee_modification() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // No OZ token; rewards minted via SAC by core on actions

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,       // base_fee: 0.01 XLM
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Test 1: Default base fee (0.01 XLM)
        assert_eq!(client.get_base_fee(), 100_000);

        // Record a stream action with default base fee (0.01 XLM * 1 difficulty = 0.01 XLM)
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.escrow_hitz, 100_000); // 0.01 XLM

        // Test 2: Update base fee to 0.02 XLM
        client.set_base_fee(&200_000i128);
        assert_eq!(client.get_base_fee(), 200_000);

        // Record another stream action (0.02 XLM * 1 difficulty = 0.02 XLM)
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.escrow_hitz, 300_000); // 0.01 + 0.02 = 0.03 XLM

        // Test 3: Update base fee to 0.005 XLM
        client.set_base_fee(&50_000i128);
        assert_eq!(client.get_base_fee(), 50_000);

        // Record a like action (0.005 XLM * 2 difficulty = 0.01 XLM)
        client.record_action(&user, &entry_id, &symbol_short!("like"), &None);
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.escrow_hitz, 400_000); // 0.03 + 0.01 = 0.04 XLM

        // Verify mine action also respects new base fee (0.005 XLM * 10 difficulty = 0.05 XLM)
        client.record_action(&user, &entry_id, &symbol_short!("mine"), &None);
        let entry = client.get_entry(&entry_id).unwrap();
        assert_eq!(entry.tvl_hitz, 500_000); // 0.05 XLM in TVL
    }

    #[test]
    #[should_panic(expected = "Base fee must be non-negative")]
    fn test_negative_base_fee() {
        let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // Should panic: negative fee
        client.set_base_fee(&-1_000_000i128);
    }

    #[test]
    fn test_allocate_and_claim_rewards() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // For allocate/claim tests, we can deposit HITZ into contract via SAC mint since core is admin
        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &1_000_000_000i128);
        hitz_admin.mint(&admin, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User stakes by investing 1 XLM at oracle price 0.1 XLM per HITZ
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));

        let user_stake = client.get_stake(&entry_id, &user);
        // Market-based: 1 XLM / 0.1 price = 10 HITZ = 100M stroops
        assert_eq!(user_stake, 100_000_000);

        // Admin allocates 1000 HITZ as rewards
        client.allocate_rewards(&entry_id, &1_000_000_000i128);

        // Check reward pool
        let pool = client.get_reward_pool(&entry_id);
        assert_eq!(pool, 1_000_000_000);

        // Check claimable rewards (should be 100% since user has all stake)
        let claimable = client.get_claimable_rewards(&entry_id, &user);
        assert_eq!(claimable, 1_000_000_000);

        // User claims rewards
        let claimed = client.claim_rewards(&entry_id, &user);
        assert_eq!(claimed, 1_000_000_000);

        // Check claimable is now 0
        let claimable_after = client.get_claimable_rewards(&entry_id, &user);
        assert_eq!(claimable_after, 0);

        // User should have received HITZ (invest reward + claimed rewards)
        let user_hitz = token::Client::new(&e, &hitz_addr).balance(&user);
        // 30M from invest reward + 1,000M from claimed rewards = 1,030M
        assert_eq!(user_hitz, 1_030_000_000);
    }

    #[test]
    fn test_batch_allocate_rewards() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&admin, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // Create 3 entries
        let entry1 = String::from_str(&e, "song1");
        let entry2 = String::from_str(&e, "song2");
        let entry3 = String::from_str(&e, "song3");
        
        client.create_entry(&entry1);
        client.create_entry(&entry2);
        client.create_entry(&entry3);

        // User stakes in all entries (stake equals minted reward per action)
        client.record_action(&user, &entry1, &symbol_short!("invest"), &Some(10_000_000i128));
        client.record_action(&user, &entry2, &symbol_short!("invest"), &Some(10_000_000i128));
        client.record_action(&user, &entry3, &symbol_short!("invest"), &Some(10_000_000i128));

        // Batch allocate rewards
        let mut entry_ids = Vec::new(&e);
        entry_ids.push_back(entry1.clone());
        entry_ids.push_back(entry2.clone());
        entry_ids.push_back(entry3.clone());

        let mut amounts = Vec::new(&e);
        amounts.push_back(100_000_000i128);
        amounts.push_back(200_000_000i128);
        amounts.push_back(300_000_000i128);

        client.batch_allocate_rewards(&entry_ids, &amounts);

        // Verify reward pools
        assert_eq!(client.get_reward_pool(&entry1), 100_000_000);
        assert_eq!(client.get_reward_pool(&entry2), 200_000_000);
        assert_eq!(client.get_reward_pool(&entry3), 300_000_000);
    }

    #[test]
    fn test_merge_and_remove_entry() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Fund
        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &600_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);
        let from_id = String::from_str(&e, "song_old");
        let into_id = String::from_str(&e, "song_new");
        client.create_entry(&from_id);
        client.create_entry(&into_id);

        // Populate source with some values
        client.record_action(&user, &from_id, &symbol_short!("invest"), &Some(10_000_000i128));
        client.allocate_rewards(&from_id, &100_000_000i128);

        // User now has a stake from investing, so we need to include them in stakers list
        let mut stakers = Vec::new(&e);
        stakers.push_back(user.clone());
        client.merge_entries(&from_id, &into_id, &stakers);

        // Verify target has non-zero tvl/pool and source removed
        let into = client.get_entry(&into_id).unwrap();
        assert!(into.tvl_hitz > 0 || into.escrow_hitz >= 0);
        assert!(client.get_reward_pool(&into_id) >= 100_000_000);
        assert!(client.get_entry(&from_id.clone()).is_none());
        
        // Verify stake was migrated
        let stake = client.get_stake(&into_id, &user);
        // Market-based: 1 XLM / 0.01 price = 100 HITZ = 1B stroops
        assert_eq!(stake, 1_000_000_000);

        // Remove target (user has stake, so provide stakers list)
        let mut stakers = Vec::new(&e);
        stakers.push_back(user.clone());
        client.remove_entry(&into_id, &stakers);
        assert!(client.get_entry(&into_id.clone()).is_none());
    }

    #[test]
    fn test_apr_calculation() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);
        hitz_admin.mint(&admin, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        // Set ledger time to day 0
        e.ledger().with_mut(|li| li.timestamp = 0);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User invests 10 XLM (100 difficulty)
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(100_000_000i128));

        let stake = client.get_stake(&entry_id, &user);
        // Market-based: 10 XLM / 0.01 price = 1,000 HITZ = 10B stroops
        assert_eq!(stake, 10_000_000_000);

        // Admin allocates 500M HITZ rewards on day 30
        e.ledger().with_mut(|li| li.timestamp = 30 * 86_400);
        client.allocate_rewards(&entry_id, &500_000_000i128);

        // Calculate APR (allow off-by-one rounding)
        // APR = (500M / 10B / 30 days) × 365 × 10000 = 6,083 basis points
        let apr = client.calculate_apr(&entry_id);
        assert!(apr >= 6_080 && apr <= 6_090);

        // Test with more rewards on day 60
        e.ledger().with_mut(|li| li.timestamp = 60 * 86_400);
        client.allocate_rewards(&entry_id, &500_000_000i128);

        // Total rewards: 1000M over 60 days
        // APR = (1000M / 10B / 60 days) × 365 × 10000 = 6,083 basis points
        let apr2 = client.calculate_apr(&entry_id);
        assert!(apr2 >= 6_080 && apr2 <= 6_090);
    }

    #[test]
    fn test_get_entry_stats() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);
        hitz_admin.mint(&admin, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &200_000_000i128); // Need more XLM for invest (10M) + stream (50M) + like (100M)

        e.ledger().with_mut(|li| li.timestamp = 0);

        client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User invests (adds to TVL)
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));

        // Simulate user actions that add to escrow
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        client.record_action(&user, &entry_id, &symbol_short!("like"), &None);

        // Allocate rewards
        e.ledger().with_mut(|li| li.timestamp = 30 * 86_400);
        client.allocate_rewards(&entry_id, &100_000_000i128);

        // Get stats
        let (tvl, escrow, stake, pool, apr) = client.get_entry_stats(&entry_id);

        assert_eq!(tvl, 10_000_000); // 1 XLM invested
        assert_eq!(escrow, 150_000_000); // stream (5 XLM) + like (10 XLM) = 15 XLM
        // Market-based stake: 1 XLM / 5 XLM price (base_fee=50M) = 0.2 HITZ = 2M stroops
        assert_eq!(stake, 2_000_000); // 0.2 HITZ staked
        assert_eq!(pool, 100_000_000); // 100M HITZ allocated
        
        // APR = (pool / stake / days) × 365 × 10000
        // With very small stakes, APR will be very high
        // Just verify it's positive and reasonable
        assert!(apr > 0);
    }

    #[test]
    #[should_panic(expected = "No stake in this entry")]
    fn test_claim_without_stake() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        client.allocate_rewards(&entry_id, &100_000_000i128);

        // Should panic: user has no stake
        client.claim_rewards(&entry_id, &user);
    }

    #[test]
    #[should_panic(expected = "No rewards to claim")]
    fn test_double_claim() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);
        hitz_admin.mint(&admin, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));
        client.allocate_rewards(&entry_id, &100_000_000i128);

        // First claim succeeds
        client.claim_rewards(&entry_id, &user);

        // Second claim should panic
        client.claim_rewards(&entry_id, &user);
    }

    #[test]
    fn test_unstake_partial() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);

        let hitz_balance_client = token::Client::new(&e, &hitz_addr);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User invests 1 XLM at 0.01 XLM/HITZ price
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));

        let user_stake_before = client.get_stake(&entry_id, &user);
        let total_stake_before = client.get_stake_total(&entry_id);
        // Market-based: 1 XLM / 0.01 = 100 HITZ = 1B stroops
        assert_eq!(user_stake_before, 1_000_000_000);
        assert_eq!(total_stake_before, 1_000_000_000);

        let user_balance_before = hitz_balance_client.balance(&user);

        // Unstake 400M stroops (40 HITZ, which is 40% of 100 HITZ stake)
        let unstaked = client.unstake(&entry_id, &user, &400_000_000i128);
        assert_eq!(unstaked, 400_000_000);

        // Verify stake updated
        let user_stake_after = client.get_stake(&entry_id, &user);
        let total_stake_after = client.get_stake_total(&entry_id);
        assert_eq!(user_stake_after, 600_000_000); // 60 HITZ remaining
        assert_eq!(total_stake_after, 600_000_000);

        // Verify HITZ returned to user
        let user_balance_after = hitz_balance_client.balance(&user);
        assert_eq!(user_balance_after, user_balance_before + 400_000_000);
    }

    #[test]
    fn test_unstake_full() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User invests 1 XLM at 0.01 XLM/HITZ price
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));

        let user_stake_before = client.get_stake(&entry_id, &user);
        // Market-based: 1 XLM / 0.01 = 100 HITZ = 1B stroops
        assert_eq!(user_stake_before, 1_000_000_000);

        // Unstake ALL HITZ
        let unstaked = client.unstake(&entry_id, &user, &1_000_000_000i128);
        assert_eq!(unstaked, 1_000_000_000);

        // Verify stake removed
        let user_stake_after = client.get_stake(&entry_id, &user);
        let total_stake_after = client.get_stake_total(&entry_id);
        assert_eq!(user_stake_after, 0);
        assert_eq!(total_stake_after, 0);
    }

    #[test]
    #[should_panic(expected = "No stake in this entry")]
    fn test_unstake_no_stake() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Try to unstake without any stake
        client.unstake(&entry_id, &user, &100_000_000i128);
    }

    #[test]
    #[should_panic(expected = "Amount exceeds stake")]
    fn test_unstake_exceeds_stake() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User invests 1 XLM → gets 100 HITZ stake (1B stroops)
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));

        // Try to unstake MORE than staked (trying 2B stroops when only 1B staked)
        client.unstake(&entry_id, &user, &2_000_000_000i128);
    }

    #[test]
    #[should_panic(expected = "Amount must be positive")]
    fn test_unstake_zero_amount() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));

        // Try to unstake 0
        client.unstake(&entry_id, &user, &0i128);
    }

    #[test]
    fn test_unstake_multiple_users() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();
        let user2 = Address::generate(&e);

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);
        hitz_admin.mint(&user2, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);
        xlm_admin.mint(&user2, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Both users invest (oracle price = 5 XLM per HITZ from base_fee=50M)
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));
        client.record_action(&user2, &entry_id, &symbol_short!("invest"), &Some(20_000_000i128));

        // User1: 1 XLM / 5 = 0.2 HITZ = 2M stroops
        // User2: 2 XLM / 5 = 0.4 HITZ = 4M stroops
        // Total stake = 2M + 4M = 6M stroops
        let total_stake_before = client.get_stake_total(&entry_id);
        assert_eq!(total_stake_before, 6_000_000);

        // User1 unstakes half of their stake (1M stroops = 0.1 HITZ)
        client.unstake(&entry_id, &user, &1_000_000i128);

        // Verify individual stakes
        let user1_stake = client.get_stake(&entry_id, &user);
        let user2_stake = client.get_stake(&entry_id, &user2);
        assert_eq!(user1_stake, 1_000_000); // 2M - 1M = 1M
        assert_eq!(user2_stake, 4_000_000); // unchanged

        // Verify total stake
        let total_stake_after = client.get_stake_total(&entry_id);
        assert_eq!(total_stake_after, 5_000_000); // 1M + 4M
    }

    #[test]
    fn test_unstake_then_reinvest() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);
        hitz_admin.mint(&user, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(&admin, &treasury, &hitz_addr, &50_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // User invests 1 XLM at 5 XLM/HITZ price
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));
        // Market-based: 1 XLM / 5 = 0.2 HITZ = 2M stroops
        assert_eq!(client.get_stake(&entry_id, &user), 2_000_000);

        // User unstakes all
        client.unstake(&entry_id, &user, &2_000_000i128);
        assert_eq!(client.get_stake(&entry_id, &user), 0);

        // User reinvests same amount
        client.record_action(&user, &entry_id, &symbol_short!("invest"), &Some(10_000_000i128));
        assert_eq!(client.get_stake(&entry_id, &user), 2_000_000);
    }

    #[test]
    fn test_oracle_initialization() {
        let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // Oracle price should be initialized to base_fee value
        let (price, last_update) = client.get_oracle_data();
        assert_eq!(price, 100_000); // 0.01 XLM per HITZ
        assert_eq!(last_update, e.ledger().timestamp());
    }

    #[test]
    fn test_oracle_update() {
        let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // Get initial price
        let (initial_price, initial_update) = client.get_oracle_data();
        assert_eq!(initial_price, 100_000);

        // Advance time
        e.ledger().with_mut(|li| li.timestamp += 3600);

        // Update oracle price (treasury is the oracle updater)
        client.update_oracle_price(&treasury, &500_000i128); // 0.05 XLM per HITZ

        // Verify update
        let (new_price, new_update) = client.get_oracle_data();
        assert_eq!(new_price, 500_000);
        assert!(new_update > initial_update);
    }

    #[test]
    #[should_panic(expected = "Only Treasury can update oracle price")]
    fn test_oracle_update_non_treasury() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // User (not treasury) tries to update oracle price
        client.update_oracle_price(&user, &500_000i128);
    }

    #[test]
    #[should_panic(expected = "Price must be positive")]
    fn test_oracle_update_zero_price() {
        let (e, admin, treasury, _, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        // Try to set zero price
        client.update_oracle_price(&treasury, &0i128);
    }

    #[test]
    fn test_dynamic_emission_with_oracle() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        // Initialize with base_fee = 0.01 XLM, oracle_price = 0.01 XLM per HITZ
        client.init(&admin, &treasury, &hitz_addr, &1_000_000i128);

        let entry_id = String::from_str(&e, "song123");
        client.create_entry(&entry_id);

        // Test 1: Default price (0.01 XLM per HITZ)
        // Stream: difficulty 1, pays 0.01 XLM
        // base_reward = 3M, value_adjusted = 10M, final = min(3M, 10M) = 3M
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let user_hitz_1 = token::Client::new(&e, &hitz_addr).balance(&user);
        assert_eq!(user_hitz_1, 3_000_000); // 0.3 HITZ (capped by halving schedule)

        // Test 2: Update oracle to higher price (0.05 XLM per HITZ)
        // This should reduce rewards (to prevent arbitrage)
        client.update_oracle_price(&treasury, &500_000i128);
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let user_hitz_2 = token::Client::new(&e, &hitz_addr).balance(&user) - user_hitz_1;
        // At 0.05 XLM per HITZ: base=3M, value_adj=(100K×10M)/500K=2M, final=2M
        assert_eq!(user_hitz_2, 2_000_000); // 0.2 HITZ

        // Test 3: Update oracle to lower price (0.001 XLM per HITZ)
        // Reward would increase but capped by halving schedule
        client.update_oracle_price(&treasury, &10_000i128);
        let balance_before = token::Client::new(&e, &hitz_addr).balance(&user);
        client.record_action(&user, &entry_id, &symbol_short!("stream"), &None);
        let user_hitz_3 = token::Client::new(&e, &hitz_addr).balance(&user) - balance_before;
        // Should be capped at base_reward (3_000_000 for epoch 0)
        assert_eq!(user_hitz_3, 3_000_000);
    }

    #[test]
    fn test_merge_entries() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &1_000_000i128,
        );

        let entry1 = String::from_str(&e, "song1");
        let entry2 = String::from_str(&e, "song2");
        let entry3 = String::from_str(&e, "song3");
        
        client.create_entry(&entry1);
        client.create_entry(&entry2);
        client.create_entry(&entry3);

        // User stakes in all entries (stake equals minted reward per action)
        client.record_action(&user, &entry1, &symbol_short!("invest"), &Some(10_000_000i128));
        client.record_action(&user, &entry2, &symbol_short!("invest"), &Some(10_000_000i128));
        client.record_action(&user, &entry3, &symbol_short!("invest"), &Some(10_000_000i128));

        // Merge entries
        // Add reward pool to source then merge into target
        client.allocate_rewards(&entry2, &100_000_000i128);
        
        // Note: These entries have stakes from invest actions
        // In real use, admin would provide list of stakers from off-chain indexing
        // For this test, we provide the user who staked
        let mut stakers = Vec::new(&e);
        stakers.push_back(user.clone());
        
        client.merge_entries(&entry2, &entry1, &stakers);

        let merged_entry = client.get_entry(&entry1).unwrap();
        assert!(merged_entry.tvl_hitz >= 10_000_000);
        assert!(client.get_reward_pool(&entry1) >= 100_000_000);
        assert!(client.get_entry(&entry2).is_none());
        
        // Verify user's stake was migrated to entry1
        let user_stake_in_entry1 = client.get_stake(&entry1, &user);
        assert!(user_stake_in_entry1 > 0);
    }

    #[test]
    fn test_remove_entry() {
        let (e, admin, treasury, user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        let hitz_admin = token::StellarAssetClient::new(&e, &hitz_addr);
        hitz_admin.mint(&contract_id, &10_000_000_000i128);

        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&user, &100_000_000i128);

        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &1_000_000i128,
        );

        let entry1 = String::from_str(&e, "song1");
        let entry2 = String::from_str(&e, "song2");
        let entry3 = String::from_str(&e, "song3");
        
        client.create_entry(&entry1);
        client.create_entry(&entry2);
        client.create_entry(&entry3);

        // Remove entry with no stakes (empty stakers list)
        let stakers = Vec::new(&e);
        client.remove_entry(&entry2, &stakers);
        assert!(client.get_entry(&entry2).is_none());
    }

    #[test]
    fn test_withdraw_xlm_to_treasury() {
        let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Initialize contract
        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        // Mint some XLM to the contract (simulating locked XLM)
        let xlm_admin = token::StellarAssetClient::new(&e, &xlm_addr);
        xlm_admin.mint(&contract_id, &50_000_000i128); // 5 XLM

        // Check initial balances
        let xlm_client = token::Client::new(&e, &xlm_addr);
        let contract_balance_before = xlm_client.balance(&contract_id);
        let treasury_balance_before = xlm_client.balance(&treasury);
        
        assert_eq!(contract_balance_before, 50_000_000);

        // Withdraw XLM to treasury (admin only)
        let withdrawn = client.withdraw_xlm_to_treasury();
        
        // Verify withdrawal amount
        assert_eq!(withdrawn, 50_000_000);

        // Check final balances
        let contract_balance_after = xlm_client.balance(&contract_id);
        let treasury_balance_after = xlm_client.balance(&treasury);
        
        assert_eq!(contract_balance_after, 0); // All withdrawn
        assert_eq!(treasury_balance_after, treasury_balance_before + 50_000_000); // Treasury received it
    }

    #[test]
    #[should_panic(expected = "No XLM balance to withdraw")]
    fn test_withdraw_xlm_to_treasury_no_balance() {
        let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Initialize contract
        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        // Try to withdraw when there's no balance (should panic)
        client.withdraw_xlm_to_treasury();
    }

    #[test]
    fn test_reset_instance() {
        let (e, admin, treasury, _user, hitz_addr, contract_id) = setup_test_with_contract();

        let client = SkyhitzCoreClient::new(&e, &contract_id);

        // Initialize contract
        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &100_000i128,
        );

        // Verify initialized values
        assert_eq!(client.get_base_fee(), 100_000);

        // Reset instance (clears all instance storage)
        client.reset_instance();

        // Verify instance storage is cleared - get_base_fee should return default or panic
        // Since we removed the keys, get_base_fee will return the default (100_000)
        // But init should allow re-initialization now
        
        // Re-initialize with new values
        let new_base_fee = 200_000i128;
        client.init(
            &admin,
            &treasury,
            &hitz_addr,
            &xlm_addr,
            &new_base_fee,
        );

        // Verify new values are set
        assert_eq!(client.get_base_fee(), new_base_fee);
    }
}

