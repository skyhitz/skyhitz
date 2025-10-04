// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Stellar Soroban Contracts ^0.4.1

//! # Skyhitz Token (HITZ)
//!
//! OpenZeppelin SEP-41 compatible fungible token with Bitcoin-style halving emission schedule.
//!
//! Token Economics:
//! - Max Supply: 21,000,000 HITZ (210,000,000,000,000 stroops with 7 decimals)
//! - No pre-mint: Tokens are released through rewards only
//! - Halving Schedule: Every 4 years (126,144,000 seconds)
//! - Initial Unit Reward: 0.3 HITZ (3,000,000 stroops)
//! - Reward halves every epoch: unit_reward = epoch0_reward / (2^epoch_index)
//!
//! Security: security@skyhitz.io
#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, BytesN};
use stellar_access::ownable::{self as ownable, Ownable};
use stellar_macros::{default_impl, only_owner};
use stellar_tokens::fungible::{Base, FungibleToken};

// ============================================================================
// Constants
// ============================================================================

const MAX_SUPPLY: i128 = 210_000_000_000_000; // 21M HITZ * 10^7

// ============================================================================
// Data Types
// ============================================================================

#[contracttype]
pub enum DataKey {
    HalvingStartTs,
    HalvingIntervalSec,
    Epoch0Reward,
    ReleasedTotal,
}

#[contract]
pub struct SkyhitzToken;

#[contractimpl]
impl SkyhitzToken {
    /// Initialize the HITZ token
    ///
    /// # Arguments
    /// * `owner` - Admin address with privileged rights
    /// * `halving_start_ts` - Unix timestamp when halving schedule begins
    /// * `halving_interval_sec` - Seconds per epoch (126,144,000 = 4 years)
    /// * `epoch0_unit_reward` - Initial unit reward in stroops (3,000,000 = 0.3 HITZ)
    pub fn __constructor(
        e: &Env,
        owner: Address,
        halving_start_ts: u64,
        halving_interval_sec: u64,
        epoch0_unit_reward: i128,
    ) {
        // Set token metadata: 7 decimals, name, symbol
        Base::set_metadata(e, 7, String::from_str(e, "Skyhitz Token"), String::from_str(e, "HITZ"));
        
        // Set owner
        ownable::set_owner(e, &owner);

        // Initialize emission parameters
        e.storage().persistent().set(&DataKey::HalvingStartTs, &halving_start_ts);
        e.storage().persistent().set(&DataKey::HalvingIntervalSec, &halving_interval_sec);
        e.storage().persistent().set(&DataKey::Epoch0Reward, &epoch0_unit_reward);
        e.storage().persistent().set(&DataKey::ReleasedTotal, &0i128);
    }

    /// Mint reward tokens based on difficulty
    ///
    /// Calculates reward using halving schedule and enforces max supply cap.
    /// Only callable by owner (Skyhitz Core contract).
    ///
    /// # Arguments
    /// * `to` - Recipient address
    /// * `difficulty` - Difficulty multiplier for reward calculation
    ///
    /// # Returns
    /// Actual amount minted (may be less than calculated if near max supply)
    #[only_owner]
    pub fn mint_reward(e: &Env, _caller: Address, to: Address, difficulty: i128) -> i128 {
        // Calculate unit reward based on current epoch
        let unit_reward = compute_unit_reward(e);
        let mut reward = unit_reward.saturating_mul(difficulty);

        // Cap by remaining supply and extend TTL
        let released_key = DataKey::ReleasedTotal;
        e.storage().persistent().extend_ttl(&released_key, 100, 535_680); // Extend to ~6 months
        let released_total: i128 = e.storage().persistent()
            .get(&released_key)
            .unwrap_or(0);
        let remaining = MAX_SUPPLY.saturating_sub(released_total);
        reward = reward.min(remaining);

        if reward > 0 {
            // Mint tokens
            Base::mint(e, &to, reward);

            // Update released total
            let new_released = released_total.saturating_add(reward);
            e.storage().persistent().set(&released_key, &new_released);
        }

        reward
    }

    /// Get emission info: (epoch_index, current_unit_reward, released_total, remaining_supply)
    pub fn emission_info(e: &Env) -> (u64, i128, i128, i128) {
        let epoch = compute_epoch_index(e);
        let unit_reward = compute_unit_reward(e);
        let released: i128 = e.storage().persistent()
            .get(&DataKey::ReleasedTotal)
            .unwrap_or(0);
        let remaining = MAX_SUPPLY.saturating_sub(released);
        (epoch, unit_reward, released, remaining)
    }

    /// Get max supply
    pub fn max_supply() -> i128 {
        MAX_SUPPLY
    }

    /// Get released total
    pub fn released_total(e: &Env) -> i128 {
        e.storage().persistent()
            .get(&DataKey::ReleasedTotal)
            .unwrap_or(0)
    }

    /// Admin mint (for initial distribution or emergency)
    /// Still respects max supply cap
    #[only_owner]
    pub fn admin_mint(e: &Env, _caller: Address, account: Address, amount: i128) {
        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let released_total: i128 = e.storage().persistent()
            .get(&DataKey::ReleasedTotal)
            .unwrap_or(0);
        let remaining = MAX_SUPPLY.saturating_sub(released_total);
        
        if amount > remaining {
            panic!("Would exceed max supply");
        }

        Base::mint(e, &account, amount);
        
        let new_released = released_total.saturating_add(amount);
        e.storage().persistent().set(&DataKey::ReleasedTotal, &new_released);
    }

    /// Upgrade contract to new WASM code
    /// Only callable by owner (admin)
    #[only_owner]
    pub fn upgrade(e: &Env, _caller: Address, new_wasm_hash: BytesN<32>) {
        e.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}

#[default_impl]
#[contractimpl]
impl FungibleToken for SkyhitzToken {
    type ContractType = Base;

    fn transfer(e: &Env, from: Address, to: Address, amount: i128) {
        Self::ContractType::transfer(e, &from, &to, amount);
    }

    fn transfer_from(e: &Env, spender: Address, from: Address, to: Address, amount: i128) {
        Self::ContractType::transfer_from(e, &spender, &from, &to, amount);
    }
}

#[default_impl]
#[contractimpl]
impl Ownable for SkyhitzToken {}

// ============================================================================
// Helper Functions
// ============================================================================

/// Compute current epoch index
fn compute_epoch_index(e: &Env) -> u64 {
    let start_ts: u64 = e.storage().persistent()
        .get(&DataKey::HalvingStartTs)
        .unwrap_or(0);
    let interval: u64 = e.storage().persistent()
        .get(&DataKey::HalvingIntervalSec)
        .unwrap_or(126_144_000);
    let now = e.ledger().timestamp();

    if now < start_ts || interval == 0 {
        return 0;
    }

    (now - start_ts) / interval
}

/// Compute current unit reward based on halving schedule
fn compute_unit_reward(e: &Env) -> i128 {
    let epoch = compute_epoch_index(e);
    let epoch0_reward: i128 = e.storage().persistent()
        .get(&DataKey::Epoch0Reward)
        .unwrap_or(3_000_000);

    if epoch >= 64 {
        return 0; // After 64 halvings, reward is negligible
    }

    // unit_reward = epoch0_reward / (2^epoch)
    epoch0_reward >> epoch // Bit shift right = divide by 2^epoch
}
