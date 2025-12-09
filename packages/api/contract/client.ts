import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}




export type DataKey = {tag: "Admin", values: void} | {tag: "Treasury", values: void} | {tag: "HitzToken", values: void} | {tag: "XlmToken", values: void} | {tag: "BaseFee", values: void} | {tag: "EmissionStartTs", values: void} | {tag: "EmissionIntervalSec", values: void} | {tag: "EmissionEpoch0UnitReward", values: void} | {tag: "OraclePrice", values: void} | {tag: "OracleLastUpdate", values: void} | {tag: "Entry", values: readonly [string]} | {tag: "Stake", values: readonly [readonly [string, string]]} | {tag: "StakeTotal", values: readonly [string]} | {tag: "RewardPool", values: readonly [string]} | {tag: "Claimed", values: readonly [readonly [string, string]]} | {tag: "EntryAt", values: readonly [u32]} | {tag: "EntryCount", values: void} | {tag: "TotalMinted", values: void} | {tag: "BatchDistTotalEscrow", values: void} | {tag: "BatchDistHitzAmount", values: void} | {tag: "ArtistEquity", values: readonly [readonly [string, string]]} | {tag: "ArtistEquityTotal", values: readonly [string]};


export interface Entry {
  created_at: u64;
  escrow_xlm: i128;
  tvl_xlm: i128;
}


/**
 * Artist equity claim for non-dilutable creator rewards
 * Stored per (entry_id, artist) pair to support collaborations
 */
export interface ArtistEquityClaim {
  claimed: i128;
  equity_bps: u32;
}

export interface Client {
  /**
   * Construct and simulate a upgrade_core transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade core contract to new WASM code (admin-only)
   * Note: Named `upgrade_core` to avoid export name collision with token's `upgrade`.
   */
  upgrade_core: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a reset_instance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reset instance storage (admin-only)
   * 
   * CRITICAL: This clears instance configuration. Contract will be unusable until re-initialized.
   * Use with extreme caution during upgrades only when you need to change core parameters.
   * 
   * Clears: Admin, Treasury, HitzToken, XlmToken, BaseFee, Oracle settings, Emission settings
   * Preserves: Persistent data (entries, stakes, rewards, TotalMinted, EntryCount)
   * 
   * After calling this, you MUST call init() again to restore functionality.
   */
  reset_instance: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a reset_entries_chunk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: remove entries in chunks to stay under footprint limits.
   * Removes entries at indexes [start, start+limit) using EntryAt(i).
   */
  reset_entries_chunk: ({start, limit}: {start: u32, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a entry_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Helper to introspect entry count before chunking.
   */
  entry_count: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a reset_entry_by_pos transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: remove one entry by its position (EntryAt(i)) and related keys.
   */
  reset_entry_by_pos: ({i}: {i: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract (one-time only)
   * 
   * # Arguments
   * * `admin` - Admin address with privileged rights
   * * `treasury` - Treasury address receiving all XLM fees (also the oracle updater)
   * * `hitz_token` - HITZ token contract address (OpenZeppelin token)
   * * `xlm_token` - XLM token contract address (SAC)
   * * `base_fee` - Base fee per difficulty unit in stroops (default 100,000 = 0.01 XLM)
   */
  init: ({admin, treasury, hitz_token, xlm_token, base_fee}: {admin: string, treasury: string, hitz_token: string, xlm_token: string, base_fee: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a set_base_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update base fee (admin-only)
   * 
   * # Arguments
   * * `new_base_fee` - New base fee per difficulty unit in stroops (e.g., 100,000 = 0.01 XLM)
   */
  set_base_fee: ({new_base_fee}: {new_base_fee: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a withdraw_xlm_to_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Transfer all contract XLM balance to treasury (admin-only)
   * 
   * Used to recover XLM that may be locked in the contract after upgrade/reset.
   * Transfers the entire XLM balance of the contract to the treasury address.
   * 
   * # Returns
   * The amount of XLM transferred in stroops
   */
  withdraw_xlm_to_treasury: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a update_oracle_price transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update oracle price (treasury-only)
   * 
   * Treasury bot calls this after fetching current market price from DEX.
   * This price is used for dynamic emission rate calculations.
   * 
   * # Arguments
   * * `caller` - Treasury address (must be the configured Treasury)
   * * `new_price` - New HITZ/XLM price in stroops (e.g., 100,000 = 0.01 XLM per HITZ)
   */
  update_oracle_price: ({caller, new_price}: {caller: string, new_price: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_oracle_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get oracle data (price and last update timestamp)
   * 
   * Returns (price_in_stroops, last_update_timestamp)
   */
  get_oracle_data: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [i128, u64]>>

  /**
   * Construct and simulate a get_base_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current base fee
   */
  get_base_fee: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total HITZ supply minted so far
   * Returns the total amount of HITZ tokens minted by this contract in stroops
   */
  get_total_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_remaining_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get remaining HITZ tokens that can be minted
   * Returns the amount of HITZ remaining before hitting the 21M cap, in stroops
   */
  get_remaining_supply: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a create_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new entry (admin-only)
   * SECURITY: Limited to MAX_ENTRIES to prevent DOS
   */
  create_entry: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a record_action transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record a user action (main entrypoint)
   * 
   * Handles fee transfer, reward calculation, and optional auto-staking
   * For invest action, amount_xlm specifies the investment (min 0.3 XLM), ignored for other actions
   */
  record_action: ({caller, entry_id, kind, amount_xlm}: {caller: string, entry_id: string, kind: string, amount_xlm: Option<i128>}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get entry data
   */
  get_entry: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Option<Entry>>>

  /**
   * Construct and simulate a list_entries transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * List entry IDs with pagination
   */
  list_entries: ({start, limit}: {start: u32, limit: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_stake transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get user's stake for an entry
   */
  get_stake: ({entry_id, owner}: {entry_id: string, owner: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_stake_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total stake for an entry
   */
  get_stake_total: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a distribute_rewards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Contract version
   * Distribute HITZ rewards proportionally based on escrow performance
   * 
   * Treasury bot calls this after buying HITZ with accumulated XLM fees.
   * Contract automatically distributes to entries based on their escrow_xlm.
   * 
   * # Arguments
   * * `caller` - Treasury address that holds the HITZ
   * * `hitz_amount` - Total HITZ to distribute across all entries
   * 
   * # Performance
   * Optimized to single loop - O(n) where n = number of entries
   * SECURITY: Limited to 1000 entries to prevent DOS
   */
  distribute_rewards: ({caller, hitz_amount}: {caller: string, hitz_amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a calculate_total_escrow_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate total escrow in batches (Phase 1 of 3-phase distribution)
   * 
   * # Arguments
   * * `caller` - Treasury address
   * * `start_index` - Starting entry index for this batch
   * * `batch_size` - Number of entries to process (max 40 for read-only)
   * 
   * # Returns
   * * `(u32, i128)` - (next_start_index, running_total_escrow)
   * 
   * # Usage
   * Call repeatedly with increasing start_index until next_start_index >= entry_count
   */
  calculate_total_escrow_batch: ({caller, start_index, batch_size}: {caller: string, start_index: u32, batch_size: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [u32, i128]>>

  /**
   * Construct and simulate a initialize_distribution transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize distribution with HITZ transfer (Phase 2 of 3-phase distribution)
   * 
   * Call this AFTER calculate_total_escrow_batch is complete
   * 
   * # Arguments
   * * `caller` - Treasury address that holds the HITZ
   * * `hitz_amount` - Total HITZ to distribute
   */
  initialize_distribution: ({caller, hitz_amount}: {caller: string, hitz_amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a distribute_rewards_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Distribute HITZ rewards in batches (Phase 3 of 3-phase distribution)
   * 
   * Call this AFTER initialize_distribution
   * 
   * # Arguments
   * * `caller` - Treasury address
   * * `start_index` - Starting entry index for this batch
   * * `batch_size` - Number of entries to process in this batch (max 15)
   * 
   * # Returns
   * * `u32` - Next start_index to use, or entry_count if complete
   * 
   * # Usage
   * 1. First: Call calculate_total_escrow_batch repeatedly until complete
   * 2. Then: Call initialize_distribution once with total HITZ amount
   * 3. Finally: Call distribute_rewards_batch repeatedly until complete
   */
  distribute_rewards_batch: ({caller, start_index, batch_size}: {caller: string, start_index: u32, batch_size: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a allocate_rewards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Allocate HITZ rewards to a specific entry's reward pool
   * 
   * Admin-only function for manual reward allocation (e.g., promotions, bonuses)
   */
  allocate_rewards: ({entry_id, hitz_amount}: {entry_id: string, hitz_amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a batch_allocate_rewards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Batch allocate rewards to multiple entries
   * 
   * Admin-only function for manual batch allocation (e.g., campaigns, airdrops)
   */
  batch_allocate_rewards: ({entry_ids, amounts}: {entry_ids: Array<string>, amounts: Array<i128>}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_rewards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim HITZ rewards from an entry's reward pool
   * 
   * Stakers receive rewards proportional to their stake from the STAKER pool.
   * If artist equity exists, stakers share (100% - total_artist_equity) of rewards.
   * Formula: claimable = (staker_pool × user_stake) / total_stake - already_claimed
   */
  claim_rewards: ({entry_id, claimer}: {entry_id: string, claimer: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a unstake transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Unstake HITZ tokens from an entry
   * 
   * Allows users to withdraw their staked HITZ back to their wallet.
   * User loses their stake percentage and future rewards from this entry.
   * 
   * # Arguments
   * * `entry_id` - The entry to unstake from
   * * `caller` - The user unstaking (must have stake)
   * * `amount` - Amount of HITZ to unstake (in stroops)
   * 
   * # Returns
   * Amount unstaked
   * 
   * # Panics
   * - If user has no stake
   * - If amount exceeds user's stake
   * - If amount <= 0
   */
  unstake: ({entry_id, caller, amount}: {entry_id: string, caller: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_claimable_rewards transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get claimable HITZ rewards for a staker (accounts for artist equity)
   */
  get_claimable_rewards: ({entry_id, user}: {entry_id: string, user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_reward_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get reward pool size for an entry
   */
  get_reward_pool: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a calculate_apr transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Calculate APR for an entry based on HITZ rewards
   * 
   * APR = ((reward_pool / total_stake) / days_since_creation) × 365 × 100
   * Returns APR as basis points (1% = 100, 10% = 1000)
   */
  calculate_apr: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_entry_stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get comprehensive entry statistics for ranking
   * 
   * Returns: (tvl_xlm, escrow_xlm, total_stake_hitz, reward_pool_hitz, apr_basis_points)
   */
  get_entry_stats: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [i128, i128, i128, i128, i128]>>

  /**
   * Construct and simulate a set_artist_equity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set non-dilutable artist equity for an entry (admin-only)
   * 
   * Allows verified artists to receive a fixed percentage of all rewards.
   * Multiple artists can have equity on the same entry (collaborations).
   * 
   * # Arguments
   * * `entry_id` - Entry to assign equity to (must exist)
   * * `artist` - Artist's wallet address
   * * `equity_bps` - Equity in basis points (1-9990, where 100 = 1%, 9990 = 99.9%)
   * 
   * # Security
   * - Admin-only to prevent unauthorized equity claims
   * - Max 99.9% total artist equity per entry (leaves 0.1% for stakers minimum)
   * - Each artist can only have one equity claim per entry
   * - Equity is immutable once set
   */
  set_artist_equity: ({entry_id, artist, equity_bps}: {entry_id: string, artist: string, equity_bps: u32}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_artist_equity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Artist claims their non-dilutable equity rewards
   * 
   * # Arguments
   * * `entry_id` - Entry to claim from
   * * `artist` - Artist's address (must match stored equity, requires auth)
   * 
   * # Returns
   * Amount of HITZ claimed
   */
  claim_artist_equity: ({entry_id, artist}: {entry_id: string, artist: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a get_artist_equity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get artist equity info for an entry
   * 
   * # Returns
   * (equity_bps, claimed_amount, claimable_amount) or (0, 0, 0) if no equity
   */
  get_artist_equity: ({entry_id, artist}: {entry_id: string, artist: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [u32, i128, i128]>>

  /**
   * Construct and simulate a get_total_artist_equity transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get total artist equity for an entry (sum of all artists)
   * 
   * # Returns
   * Total equity in basis points (0-9990)
   */
  get_total_artist_equity: ({entry_id}: {entry_id: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  version: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a merge_entries transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Merge one entry into another (admin-only).
   * All escrow, TVL, reward pool, and stakes move from `from_id` to `into_id`.
   * The `from_id` entry is removed from storage and index.
   * 
   * For stake migration:
   * - If `stakers` list is provided: migrates those users' stakes from from_id to into_id
   * - If `stakers` is empty: only moves totals (admin must ensure no orphaned stakes)
   * 
   * Note: We cannot iterate all stakers (no index), so admin must provide the list.
   * Use off-chain indexing or events to track stakers.
   */
  merge_entries: ({from_id, into_id, stakers}: {from_id: string, into_id: string, stakers: Array<string>}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a remove_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove an entry completely (admin-only).
   * 
   * If `stakers` list is provided:
   * - Returns all stakes to those users
   * - Verifies returned stakes match total
   * - Then removes entry
   * 
   * If `stakers` is empty:
   * - Removes entry only if total stake is 0
   * - Otherwise panics (admin must provide staker list)
   * 
   * Note: We cannot iterate all stakers (no index), so admin must provide the list.
   * Use off-chain indexing or events to track stakers.
   */
  remove_entry: ({entry_id, stakers}: {entry_id: string, stakers: Array<string>}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAFgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAIVHJlYXN1cnkAAAAAAAAAAAAAAAlIaXR6VG9rZW4AAAAAAAAAAAAAAAAAAAhYbG1Ub2tlbgAAAAAAAAAAAAAAB0Jhc2VGZWUAAAAAAAAAAAAAAAAPRW1pc3Npb25TdGFydFRzAAAAAAAAAAAAAAAAE0VtaXNzaW9uSW50ZXJ2YWxTZWMAAAAAAAAAAAAAAAAYRW1pc3Npb25FcG9jaDBVbml0UmV3YXJkAAAAAAAAAAAAAAALT3JhY2xlUHJpY2UAAAAAAAAAAAAAAAAQT3JhY2xlTGFzdFVwZGF0ZQAAAAEAAAAAAAAABUVudHJ5AAAAAAAAAQAAABAAAAABAAAAAAAAAAVTdGFrZQAAAAAAAAEAAAPtAAAAAgAAABAAAAATAAAAAQAAAAAAAAAKU3Rha2VUb3RhbAAAAAAAAQAAABAAAAABAAAAAAAAAApSZXdhcmRQb29sAAAAAAABAAAAEAAAAAEAAAAAAAAAB0NsYWltZWQAAAAAAQAAA+0AAAACAAAAEAAAABMAAAABAAAAAAAAAAdFbnRyeUF0AAAAAAEAAAAEAAAAAAAAAAAAAAAKRW50cnlDb3VudAAAAAAAAAAAAAAAAAALVG90YWxNaW50ZWQAAAAAAAAAAAAAAAAUQmF0Y2hEaXN0VG90YWxFc2Nyb3cAAAAAAAAAAAAAABNCYXRjaERpc3RIaXR6QW1vdW50AAAAAAEAAAAAAAAADEFydGlzdEVxdWl0eQAAAAEAAAPtAAAAAgAAABAAAAATAAAAAQAAAAAAAAARQXJ0aXN0RXF1aXR5VG90YWwAAAAAAAABAAAAEA==",
        "AAAAAQAAAAAAAAAAAAAABUVudHJ5AAAAAAAAAwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAKZXNjcm93X3hsbQAAAAAACwAAAAAAAAAHdHZsX3hsbQAAAAAL",
        "AAAAAQAAAHJBcnRpc3QgZXF1aXR5IGNsYWltIGZvciBub24tZGlsdXRhYmxlIGNyZWF0b3IgcmV3YXJkcwpTdG9yZWQgcGVyIChlbnRyeV9pZCwgYXJ0aXN0KSBwYWlyIHRvIHN1cHBvcnQgY29sbGFib3JhdGlvbnMAAAAAAAAAAAARQXJ0aXN0RXF1aXR5Q2xhaW0AAAAAAAACAAAAAAAAAAdjbGFpbWVkAAAAAAsAAAAAAAAACmVxdWl0eV9icHMAAAAAAAQ=",
        "AAAAAAAAAIVVcGdyYWRlIGNvcmUgY29udHJhY3QgdG8gbmV3IFdBU00gY29kZSAoYWRtaW4tb25seSkKTm90ZTogTmFtZWQgYHVwZ3JhZGVfY29yZWAgdG8gYXZvaWQgZXhwb3J0IG5hbWUgY29sbGlzaW9uIHdpdGggdG9rZW4ncyBgdXBncmFkZWAuAAAAAAAADHVwZ3JhZGVfY29yZQAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAc1SZXNldCBpbnN0YW5jZSBzdG9yYWdlIChhZG1pbi1vbmx5KQoKQ1JJVElDQUw6IFRoaXMgY2xlYXJzIGluc3RhbmNlIGNvbmZpZ3VyYXRpb24uIENvbnRyYWN0IHdpbGwgYmUgdW51c2FibGUgdW50aWwgcmUtaW5pdGlhbGl6ZWQuClVzZSB3aXRoIGV4dHJlbWUgY2F1dGlvbiBkdXJpbmcgdXBncmFkZXMgb25seSB3aGVuIHlvdSBuZWVkIHRvIGNoYW5nZSBjb3JlIHBhcmFtZXRlcnMuCgpDbGVhcnM6IEFkbWluLCBUcmVhc3VyeSwgSGl0elRva2VuLCBYbG1Ub2tlbiwgQmFzZUZlZSwgT3JhY2xlIHNldHRpbmdzLCBFbWlzc2lvbiBzZXR0aW5ncwpQcmVzZXJ2ZXM6IFBlcnNpc3RlbnQgZGF0YSAoZW50cmllcywgc3Rha2VzLCByZXdhcmRzLCBUb3RhbE1pbnRlZCwgRW50cnlDb3VudCkKCkFmdGVyIGNhbGxpbmcgdGhpcywgeW91IE1VU1QgY2FsbCBpbml0KCkgYWdhaW4gdG8gcmVzdG9yZSBmdW5jdGlvbmFsaXR5LgAAAAAAAA5yZXNldF9pbnN0YW5jZQAAAAAAAAAAAAA=",
        "AAAAAAAAAIZBZG1pbi1vbmx5OiByZW1vdmUgZW50cmllcyBpbiBjaHVua3MgdG8gc3RheSB1bmRlciBmb290cHJpbnQgbGltaXRzLgpSZW1vdmVzIGVudHJpZXMgYXQgaW5kZXhlcyBbc3RhcnQsIHN0YXJ0K2xpbWl0KSB1c2luZyBFbnRyeUF0KGkpLgAAAAAAE3Jlc2V0X2VudHJpZXNfY2h1bmsAAAAAAgAAAAAAAAAFc3RhcnQAAAAAAAAEAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAAA",
        "AAAAAAAAADFIZWxwZXIgdG8gaW50cm9zcGVjdCBlbnRyeSBjb3VudCBiZWZvcmUgY2h1bmtpbmcuAAAAAAAAC2VudHJ5X2NvdW50AAAAAAAAAAABAAAABA==",
        "AAAAAAAAAEtBZG1pbi1vbmx5OiByZW1vdmUgb25lIGVudHJ5IGJ5IGl0cyBwb3NpdGlvbiAoRW50cnlBdChpKSkgYW5kIHJlbGF0ZWQga2V5cy4AAAAAEnJlc2V0X2VudHJ5X2J5X3BvcwAAAAAAAQAAAAAAAAABaQAAAAAAAAQAAAAA",
        "AAAAAAAAAX1Jbml0aWFsaXplIHRoZSBjb250cmFjdCAob25lLXRpbWUgb25seSkKCiMgQXJndW1lbnRzCiogYGFkbWluYCAtIEFkbWluIGFkZHJlc3Mgd2l0aCBwcml2aWxlZ2VkIHJpZ2h0cwoqIGB0cmVhc3VyeWAgLSBUcmVhc3VyeSBhZGRyZXNzIHJlY2VpdmluZyBhbGwgWExNIGZlZXMgKGFsc28gdGhlIG9yYWNsZSB1cGRhdGVyKQoqIGBoaXR6X3Rva2VuYCAtIEhJVFogdG9rZW4gY29udHJhY3QgYWRkcmVzcyAoT3BlblplcHBlbGluIHRva2VuKQoqIGB4bG1fdG9rZW5gIC0gWExNIHRva2VuIGNvbnRyYWN0IGFkZHJlc3MgKFNBQykKKiBgYmFzZV9mZWVgIC0gQmFzZSBmZWUgcGVyIGRpZmZpY3VsdHkgdW5pdCBpbiBzdHJvb3BzIChkZWZhdWx0IDEwMCwwMDAgPSAwLjAxIFhMTSkAAAAAAAAEaW5pdAAAAAUAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIdHJlYXN1cnkAAAATAAAAAAAAAApoaXR6X3Rva2VuAAAAAAATAAAAAAAAAAl4bG1fdG9rZW4AAAAAAAATAAAAAAAAAAhiYXNlX2ZlZQAAAAsAAAAA",
        "AAAAAAAAAINVcGRhdGUgYmFzZSBmZWUgKGFkbWluLW9ubHkpCgojIEFyZ3VtZW50cwoqIGBuZXdfYmFzZV9mZWVgIC0gTmV3IGJhc2UgZmVlIHBlciBkaWZmaWN1bHR5IHVuaXQgaW4gc3Ryb29wcyAoZS5nLiwgMTAwLDAwMCA9IDAuMDEgWExNKQAAAAAMc2V0X2Jhc2VfZmVlAAAAAQAAAAAAAAAMbmV3X2Jhc2VfZmVlAAAACwAAAAA=",
        "AAAAAAAAAQVUcmFuc2ZlciBhbGwgY29udHJhY3QgWExNIGJhbGFuY2UgdG8gdHJlYXN1cnkgKGFkbWluLW9ubHkpCgpVc2VkIHRvIHJlY292ZXIgWExNIHRoYXQgbWF5IGJlIGxvY2tlZCBpbiB0aGUgY29udHJhY3QgYWZ0ZXIgdXBncmFkZS9yZXNldC4KVHJhbnNmZXJzIHRoZSBlbnRpcmUgWExNIGJhbGFuY2Ugb2YgdGhlIGNvbnRyYWN0IHRvIHRoZSB0cmVhc3VyeSBhZGRyZXNzLgoKIyBSZXR1cm5zClRoZSBhbW91bnQgb2YgWExNIHRyYW5zZmVycmVkIGluIHN0cm9vcHMAAAAAAAAYd2l0aGRyYXdfeGxtX3RvX3RyZWFzdXJ5AAAAAAAAAAEAAAAL",
        "AAAAAAAAAURVcGRhdGUgb3JhY2xlIHByaWNlICh0cmVhc3VyeS1vbmx5KQoKVHJlYXN1cnkgYm90IGNhbGxzIHRoaXMgYWZ0ZXIgZmV0Y2hpbmcgY3VycmVudCBtYXJrZXQgcHJpY2UgZnJvbSBERVguClRoaXMgcHJpY2UgaXMgdXNlZCBmb3IgZHluYW1pYyBlbWlzc2lvbiByYXRlIGNhbGN1bGF0aW9ucy4KCiMgQXJndW1lbnRzCiogYGNhbGxlcmAgLSBUcmVhc3VyeSBhZGRyZXNzIChtdXN0IGJlIHRoZSBjb25maWd1cmVkIFRyZWFzdXJ5KQoqIGBuZXdfcHJpY2VgIC0gTmV3IEhJVFovWExNIHByaWNlIGluIHN0cm9vcHMgKGUuZy4sIDEwMCwwMDAgPSAwLjAxIFhMTSBwZXIgSElUWikAAAATdXBkYXRlX29yYWNsZV9wcmljZQAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAACW5ld19wcmljZQAAAAAAAAsAAAAA",
        "AAAAAAAAAGRHZXQgb3JhY2xlIGRhdGEgKHByaWNlIGFuZCBsYXN0IHVwZGF0ZSB0aW1lc3RhbXApCgpSZXR1cm5zIChwcmljZV9pbl9zdHJvb3BzLCBsYXN0X3VwZGF0ZV90aW1lc3RhbXApAAAAD2dldF9vcmFjbGVfZGF0YQAAAAAAAAAAAQAAA+0AAAACAAAACwAAAAY=",
        "AAAAAAAAABRHZXQgY3VycmVudCBiYXNlIGZlZQAAAAxnZXRfYmFzZV9mZWUAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAG5HZXQgdG90YWwgSElUWiBzdXBwbHkgbWludGVkIHNvIGZhcgpSZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgb2YgSElUWiB0b2tlbnMgbWludGVkIGJ5IHRoaXMgY29udHJhY3QgaW4gc3Ryb29wcwAAAAAAEGdldF90b3RhbF9zdXBwbHkAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAHhHZXQgcmVtYWluaW5nIEhJVFogdG9rZW5zIHRoYXQgY2FuIGJlIG1pbnRlZApSZXR1cm5zIHRoZSBhbW91bnQgb2YgSElUWiByZW1haW5pbmcgYmVmb3JlIGhpdHRpbmcgdGhlIDIxTSBjYXAsIGluIHN0cm9vcHMAAAAUZ2V0X3JlbWFpbmluZ19zdXBwbHkAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAE9DcmVhdGUgYSBuZXcgZW50cnkgKGFkbWluLW9ubHkpClNFQ1VSSVRZOiBMaW1pdGVkIHRvIE1BWF9FTlRSSUVTIHRvIHByZXZlbnQgRE9TAAAAAAxjcmVhdGVfZW50cnkAAAABAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAA",
        "AAAAAAAAAMtSZWNvcmQgYSB1c2VyIGFjdGlvbiAobWFpbiBlbnRyeXBvaW50KQoKSGFuZGxlcyBmZWUgdHJhbnNmZXIsIHJld2FyZCBjYWxjdWxhdGlvbiwgYW5kIG9wdGlvbmFsIGF1dG8tc3Rha2luZwpGb3IgaW52ZXN0IGFjdGlvbiwgYW1vdW50X3hsbSBzcGVjaWZpZXMgdGhlIGludmVzdG1lbnQgKG1pbiAwLjMgWExNKSwgaWdub3JlZCBmb3Igb3RoZXIgYWN0aW9ucwAAAAANcmVjb3JkX2FjdGlvbgAAAAAAAAQAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAAAAAARraW5kAAAAEQAAAAAAAAAKYW1vdW50X3hsbQAAAAAD6AAAAAsAAAAA",
        "AAAAAAAAAA5HZXQgZW50cnkgZGF0YQAAAAAACWdldF9lbnRyeQAAAAAAAAEAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAEAAAPoAAAH0AAAAAVFbnRyeQAAAA==",
        "AAAAAAAAAB5MaXN0IGVudHJ5IElEcyB3aXRoIHBhZ2luYXRpb24AAAAAAAxsaXN0X2VudHJpZXMAAAACAAAAAAAAAAVzdGFydAAAAAAAAAQAAAAAAAAABWxpbWl0AAAAAAAABAAAAAEAAAPqAAAAEA==",
        "AAAAAAAAAB1HZXQgdXNlcidzIHN0YWtlIGZvciBhbiBlbnRyeQAAAAAAAAlnZXRfc3Rha2UAAAAAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAABxHZXQgdG90YWwgc3Rha2UgZm9yIGFuIGVudHJ5AAAAD2dldF9zdGFrZV90b3RhbAAAAAABAAAAAAAAAAhlbnRyeV9pZAAAABAAAAABAAAACw==",
        "AAAAAAAAAdtDb250cmFjdCB2ZXJzaW9uCkRpc3RyaWJ1dGUgSElUWiByZXdhcmRzIHByb3BvcnRpb25hbGx5IGJhc2VkIG9uIGVzY3JvdyBwZXJmb3JtYW5jZQoKVHJlYXN1cnkgYm90IGNhbGxzIHRoaXMgYWZ0ZXIgYnV5aW5nIEhJVFogd2l0aCBhY2N1bXVsYXRlZCBYTE0gZmVlcy4KQ29udHJhY3QgYXV0b21hdGljYWxseSBkaXN0cmlidXRlcyB0byBlbnRyaWVzIGJhc2VkIG9uIHRoZWlyIGVzY3Jvd194bG0uCgojIEFyZ3VtZW50cwoqIGBjYWxsZXJgIC0gVHJlYXN1cnkgYWRkcmVzcyB0aGF0IGhvbGRzIHRoZSBISVRaCiogYGhpdHpfYW1vdW50YCAtIFRvdGFsIEhJVFogdG8gZGlzdHJpYnV0ZSBhY3Jvc3MgYWxsIGVudHJpZXMKCiMgUGVyZm9ybWFuY2UKT3B0aW1pemVkIHRvIHNpbmdsZSBsb29wIC0gTyhuKSB3aGVyZSBuID0gbnVtYmVyIG9mIGVudHJpZXMKU0VDVVJJVFk6IExpbWl0ZWQgdG8gMTAwMCBlbnRyaWVzIHRvIHByZXZlbnQgRE9TAAAAABJkaXN0cmlidXRlX3Jld2FyZHMAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAALaGl0el9hbW91bnQAAAAACwAAAAA=",
        "AAAAAAAAAYpDYWxjdWxhdGUgdG90YWwgZXNjcm93IGluIGJhdGNoZXMgKFBoYXNlIDEgb2YgMy1waGFzZSBkaXN0cmlidXRpb24pCgojIEFyZ3VtZW50cwoqIGBjYWxsZXJgIC0gVHJlYXN1cnkgYWRkcmVzcwoqIGBzdGFydF9pbmRleGAgLSBTdGFydGluZyBlbnRyeSBpbmRleCBmb3IgdGhpcyBiYXRjaAoqIGBiYXRjaF9zaXplYCAtIE51bWJlciBvZiBlbnRyaWVzIHRvIHByb2Nlc3MgKG1heCA0MCBmb3IgcmVhZC1vbmx5KQoKIyBSZXR1cm5zCiogYCh1MzIsIGkxMjgpYCAtIChuZXh0X3N0YXJ0X2luZGV4LCBydW5uaW5nX3RvdGFsX2VzY3JvdykKCiMgVXNhZ2UKQ2FsbCByZXBlYXRlZGx5IHdpdGggaW5jcmVhc2luZyBzdGFydF9pbmRleCB1bnRpbCBuZXh0X3N0YXJ0X2luZGV4ID49IGVudHJ5X2NvdW50AAAAAAAcY2FsY3VsYXRlX3RvdGFsX2VzY3Jvd19iYXRjaAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAALc3RhcnRfaW5kZXgAAAAABAAAAAAAAAAKYmF0Y2hfc2l6ZQAAAAAABAAAAAEAAAPtAAAAAgAAAAQAAAAL",
        "AAAAAAAAAPBJbml0aWFsaXplIGRpc3RyaWJ1dGlvbiB3aXRoIEhJVFogdHJhbnNmZXIgKFBoYXNlIDIgb2YgMy1waGFzZSBkaXN0cmlidXRpb24pCgpDYWxsIHRoaXMgQUZURVIgY2FsY3VsYXRlX3RvdGFsX2VzY3Jvd19iYXRjaCBpcyBjb21wbGV0ZQoKIyBBcmd1bWVudHMKKiBgY2FsbGVyYCAtIFRyZWFzdXJ5IGFkZHJlc3MgdGhhdCBob2xkcyB0aGUgSElUWgoqIGBoaXR6X2Ftb3VudGAgLSBUb3RhbCBISVRaIHRvIGRpc3RyaWJ1dGUAAAAXaW5pdGlhbGl6ZV9kaXN0cmlidXRpb24AAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAtoaXR6X2Ftb3VudAAAAAALAAAAAA==",
        "AAAAAAAAAjFEaXN0cmlidXRlIEhJVFogcmV3YXJkcyBpbiBiYXRjaGVzIChQaGFzZSAzIG9mIDMtcGhhc2UgZGlzdHJpYnV0aW9uKQoKQ2FsbCB0aGlzIEFGVEVSIGluaXRpYWxpemVfZGlzdHJpYnV0aW9uCgojIEFyZ3VtZW50cwoqIGBjYWxsZXJgIC0gVHJlYXN1cnkgYWRkcmVzcwoqIGBzdGFydF9pbmRleGAgLSBTdGFydGluZyBlbnRyeSBpbmRleCBmb3IgdGhpcyBiYXRjaAoqIGBiYXRjaF9zaXplYCAtIE51bWJlciBvZiBlbnRyaWVzIHRvIHByb2Nlc3MgaW4gdGhpcyBiYXRjaCAobWF4IDE1KQoKIyBSZXR1cm5zCiogYHUzMmAgLSBOZXh0IHN0YXJ0X2luZGV4IHRvIHVzZSwgb3IgZW50cnlfY291bnQgaWYgY29tcGxldGUKCiMgVXNhZ2UKMS4gRmlyc3Q6IENhbGwgY2FsY3VsYXRlX3RvdGFsX2VzY3Jvd19iYXRjaCByZXBlYXRlZGx5IHVudGlsIGNvbXBsZXRlCjIuIFRoZW46IENhbGwgaW5pdGlhbGl6ZV9kaXN0cmlidXRpb24gb25jZSB3aXRoIHRvdGFsIEhJVFogYW1vdW50CjMuIEZpbmFsbHk6IENhbGwgZGlzdHJpYnV0ZV9yZXdhcmRzX2JhdGNoIHJlcGVhdGVkbHkgdW50aWwgY29tcGxldGUAAAAAAAAYZGlzdHJpYnV0ZV9yZXdhcmRzX2JhdGNoAAAAAwAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAtzdGFydF9pbmRleAAAAAAEAAAAAAAAAApiYXRjaF9zaXplAAAAAAAEAAAAAQAAAAQ=",
        "AAAAAAAAAIVBbGxvY2F0ZSBISVRaIHJld2FyZHMgdG8gYSBzcGVjaWZpYyBlbnRyeSdzIHJld2FyZCBwb29sCgpBZG1pbi1vbmx5IGZ1bmN0aW9uIGZvciBtYW51YWwgcmV3YXJkIGFsbG9jYXRpb24gKGUuZy4sIHByb21vdGlvbnMsIGJvbnVzZXMpAAAAAAAAEGFsbG9jYXRlX3Jld2FyZHMAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAAC2hpdHpfYW1vdW50AAAAAAsAAAAA",
        "AAAAAAAAAHdCYXRjaCBhbGxvY2F0ZSByZXdhcmRzIHRvIG11bHRpcGxlIGVudHJpZXMKCkFkbWluLW9ubHkgZnVuY3Rpb24gZm9yIG1hbnVhbCBiYXRjaCBhbGxvY2F0aW9uIChlLmcuLCBjYW1wYWlnbnMsIGFpcmRyb3BzKQAAAAAWYmF0Y2hfYWxsb2NhdGVfcmV3YXJkcwAAAAAAAgAAAAAAAAAJZW50cnlfaWRzAAAAAAAD6gAAABAAAAAAAAAAB2Ftb3VudHMAAAAD6gAAAAsAAAAA",
        "AAAAAAAAARpDbGFpbSBISVRaIHJld2FyZHMgZnJvbSBhbiBlbnRyeSdzIHJld2FyZCBwb29sCgpTdGFrZXJzIHJlY2VpdmUgcmV3YXJkcyBwcm9wb3J0aW9uYWwgdG8gdGhlaXIgc3Rha2UgZnJvbSB0aGUgU1RBS0VSIHBvb2wuCklmIGFydGlzdCBlcXVpdHkgZXhpc3RzLCBzdGFrZXJzIHNoYXJlICgxMDAlIC0gdG90YWxfYXJ0aXN0X2VxdWl0eSkgb2YgcmV3YXJkcy4KRm9ybXVsYTogY2xhaW1hYmxlID0gKHN0YWtlcl9wb29sIMOXIHVzZXJfc3Rha2UpIC8gdG90YWxfc3Rha2UgLSBhbHJlYWR5X2NsYWltZWQAAAAAAA1jbGFpbV9yZXdhcmRzAAAAAAAAAgAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAAAAAAdjbGFpbWVyAAAAABMAAAABAAAACw==",
        "AAAAAAAAAbNVbnN0YWtlIEhJVFogdG9rZW5zIGZyb20gYW4gZW50cnkKCkFsbG93cyB1c2VycyB0byB3aXRoZHJhdyB0aGVpciBzdGFrZWQgSElUWiBiYWNrIHRvIHRoZWlyIHdhbGxldC4KVXNlciBsb3NlcyB0aGVpciBzdGFrZSBwZXJjZW50YWdlIGFuZCBmdXR1cmUgcmV3YXJkcyBmcm9tIHRoaXMgZW50cnkuCgojIEFyZ3VtZW50cwoqIGBlbnRyeV9pZGAgLSBUaGUgZW50cnkgdG8gdW5zdGFrZSBmcm9tCiogYGNhbGxlcmAgLSBUaGUgdXNlciB1bnN0YWtpbmcgKG11c3QgaGF2ZSBzdGFrZSkKKiBgYW1vdW50YCAtIEFtb3VudCBvZiBISVRaIHRvIHVuc3Rha2UgKGluIHN0cm9vcHMpCgojIFJldHVybnMKQW1vdW50IHVuc3Rha2VkCgojIFBhbmljcwotIElmIHVzZXIgaGFzIG5vIHN0YWtlCi0gSWYgYW1vdW50IGV4Y2VlZHMgdXNlcidzIHN0YWtlCi0gSWYgYW1vdW50IDw9IDAAAAAAB3Vuc3Rha2UAAAAAAwAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAAL",
        "AAAAAAAAAERHZXQgY2xhaW1hYmxlIEhJVFogcmV3YXJkcyBmb3IgYSBzdGFrZXIgKGFjY291bnRzIGZvciBhcnRpc3QgZXF1aXR5KQAAABVnZXRfY2xhaW1hYmxlX3Jld2FyZHMAAAAAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAABHVzZXIAAAATAAAAAQAAAAs=",
        "AAAAAAAAACFHZXQgcmV3YXJkIHBvb2wgc2l6ZSBmb3IgYW4gZW50cnkAAAAAAAAPZ2V0X3Jld2FyZF9wb29sAAAAAAEAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAEAAAAL",
        "AAAAAAAAAKxDYWxjdWxhdGUgQVBSIGZvciBhbiBlbnRyeSBiYXNlZCBvbiBISVRaIHJld2FyZHMKCkFQUiA9ICgocmV3YXJkX3Bvb2wgLyB0b3RhbF9zdGFrZSkgLyBkYXlzX3NpbmNlX2NyZWF0aW9uKSDDlyAzNjUgw5cgMTAwClJldHVybnMgQVBSIGFzIGJhc2lzIHBvaW50cyAoMSUgPSAxMDAsIDEwJSA9IDEwMDApAAAADWNhbGN1bGF0ZV9hcHIAAAAAAAABAAAAAAAAAAhlbnRyeV9pZAAAABAAAAABAAAACw==",
        "AAAAAAAAAIRHZXQgY29tcHJlaGVuc2l2ZSBlbnRyeSBzdGF0aXN0aWNzIGZvciByYW5raW5nCgpSZXR1cm5zOiAodHZsX3hsbSwgZXNjcm93X3hsbSwgdG90YWxfc3Rha2VfaGl0eiwgcmV3YXJkX3Bvb2xfaGl0eiwgYXByX2Jhc2lzX3BvaW50cykAAAAPZ2V0X2VudHJ5X3N0YXRzAAAAAAEAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAEAAAPtAAAABQAAAAsAAAALAAAACwAAAAsAAAAL",
        "AAAAAAAAAl1TZXQgbm9uLWRpbHV0YWJsZSBhcnRpc3QgZXF1aXR5IGZvciBhbiBlbnRyeSAoYWRtaW4tb25seSkKCkFsbG93cyB2ZXJpZmllZCBhcnRpc3RzIHRvIHJlY2VpdmUgYSBmaXhlZCBwZXJjZW50YWdlIG9mIGFsbCByZXdhcmRzLgpNdWx0aXBsZSBhcnRpc3RzIGNhbiBoYXZlIGVxdWl0eSBvbiB0aGUgc2FtZSBlbnRyeSAoY29sbGFib3JhdGlvbnMpLgoKIyBBcmd1bWVudHMKKiBgZW50cnlfaWRgIC0gRW50cnkgdG8gYXNzaWduIGVxdWl0eSB0byAobXVzdCBleGlzdCkKKiBgYXJ0aXN0YCAtIEFydGlzdCdzIHdhbGxldCBhZGRyZXNzCiogYGVxdWl0eV9icHNgIC0gRXF1aXR5IGluIGJhc2lzIHBvaW50cyAoMS05OTkwLCB3aGVyZSAxMDAgPSAxJSwgOTk5MCA9IDk5LjklKQoKIyBTZWN1cml0eQotIEFkbWluLW9ubHkgdG8gcHJldmVudCB1bmF1dGhvcml6ZWQgZXF1aXR5IGNsYWltcwotIE1heCA5OS45JSB0b3RhbCBhcnRpc3QgZXF1aXR5IHBlciBlbnRyeSAobGVhdmVzIDAuMSUgZm9yIHN0YWtlcnMgbWluaW11bSkKLSBFYWNoIGFydGlzdCBjYW4gb25seSBoYXZlIG9uZSBlcXVpdHkgY2xhaW0gcGVyIGVudHJ5Ci0gRXF1aXR5IGlzIGltbXV0YWJsZSBvbmNlIHNldAAAAAAAABFzZXRfYXJ0aXN0X2VxdWl0eQAAAAAAAAMAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAAAAAAGYXJ0aXN0AAAAAAATAAAAAAAAAAplcXVpdHlfYnBzAAAAAAAEAAAAAA==",
        "AAAAAAAAAMpBcnRpc3QgY2xhaW1zIHRoZWlyIG5vbi1kaWx1dGFibGUgZXF1aXR5IHJld2FyZHMKCiMgQXJndW1lbnRzCiogYGVudHJ5X2lkYCAtIEVudHJ5IHRvIGNsYWltIGZyb20KKiBgYXJ0aXN0YCAtIEFydGlzdCdzIGFkZHJlc3MgKG11c3QgbWF0Y2ggc3RvcmVkIGVxdWl0eSwgcmVxdWlyZXMgYXV0aCkKCiMgUmV0dXJucwpBbW91bnQgb2YgSElUWiBjbGFpbWVkAAAAAAATY2xhaW1fYXJ0aXN0X2VxdWl0eQAAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAABmFydGlzdAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAAHdHZXQgYXJ0aXN0IGVxdWl0eSBpbmZvIGZvciBhbiBlbnRyeQoKIyBSZXR1cm5zCihlcXVpdHlfYnBzLCBjbGFpbWVkX2Ftb3VudCwgY2xhaW1hYmxlX2Ftb3VudCkgb3IgKDAsIDAsIDApIGlmIG5vIGVxdWl0eQAAAAARZ2V0X2FydGlzdF9lcXVpdHkAAAAAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAABmFydGlzdAAAAAAAEwAAAAEAAAPtAAAAAwAAAAQAAAALAAAACw==",
        "AAAAAAAAAGpHZXQgdG90YWwgYXJ0aXN0IGVxdWl0eSBmb3IgYW4gZW50cnkgKHN1bSBvZiBhbGwgYXJ0aXN0cykKCiMgUmV0dXJucwpUb3RhbCBlcXVpdHkgaW4gYmFzaXMgcG9pbnRzICgwLTk5OTApAAAAAAAXZ2V0X3RvdGFsX2FydGlzdF9lcXVpdHkAAAAAAQAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAe5NZXJnZSBvbmUgZW50cnkgaW50byBhbm90aGVyIChhZG1pbi1vbmx5KS4KQWxsIGVzY3JvdywgVFZMLCByZXdhcmQgcG9vbCwgYW5kIHN0YWtlcyBtb3ZlIGZyb20gYGZyb21faWRgIHRvIGBpbnRvX2lkYC4KVGhlIGBmcm9tX2lkYCBlbnRyeSBpcyByZW1vdmVkIGZyb20gc3RvcmFnZSBhbmQgaW5kZXguCgpGb3Igc3Rha2UgbWlncmF0aW9uOgotIElmIGBzdGFrZXJzYCBsaXN0IGlzIHByb3ZpZGVkOiBtaWdyYXRlcyB0aG9zZSB1c2Vycycgc3Rha2VzIGZyb20gZnJvbV9pZCB0byBpbnRvX2lkCi0gSWYgYHN0YWtlcnNgIGlzIGVtcHR5OiBvbmx5IG1vdmVzIHRvdGFscyAoYWRtaW4gbXVzdCBlbnN1cmUgbm8gb3JwaGFuZWQgc3Rha2VzKQoKTm90ZTogV2UgY2Fubm90IGl0ZXJhdGUgYWxsIHN0YWtlcnMgKG5vIGluZGV4KSwgc28gYWRtaW4gbXVzdCBwcm92aWRlIHRoZSBsaXN0LgpVc2Ugb2ZmLWNoYWluIGluZGV4aW5nIG9yIGV2ZW50cyB0byB0cmFjayBzdGFrZXJzLgAAAAAADW1lcmdlX2VudHJpZXMAAAAAAAADAAAAAAAAAAdmcm9tX2lkAAAAABAAAAAAAAAAB2ludG9faWQAAAAAEAAAAAAAAAAHc3Rha2VycwAAAAPqAAAAEwAAAAA=",
        "AAAAAAAAAaFSZW1vdmUgYW4gZW50cnkgY29tcGxldGVseSAoYWRtaW4tb25seSkuCgpJZiBgc3Rha2Vyc2AgbGlzdCBpcyBwcm92aWRlZDoKLSBSZXR1cm5zIGFsbCBzdGFrZXMgdG8gdGhvc2UgdXNlcnMKLSBWZXJpZmllcyByZXR1cm5lZCBzdGFrZXMgbWF0Y2ggdG90YWwKLSBUaGVuIHJlbW92ZXMgZW50cnkKCklmIGBzdGFrZXJzYCBpcyBlbXB0eToKLSBSZW1vdmVzIGVudHJ5IG9ubHkgaWYgdG90YWwgc3Rha2UgaXMgMAotIE90aGVyd2lzZSBwYW5pY3MgKGFkbWluIG11c3QgcHJvdmlkZSBzdGFrZXIgbGlzdCkKCk5vdGU6IFdlIGNhbm5vdCBpdGVyYXRlIGFsbCBzdGFrZXJzIChubyBpbmRleCksIHNvIGFkbWluIG11c3QgcHJvdmlkZSB0aGUgbGlzdC4KVXNlIG9mZi1jaGFpbiBpbmRleGluZyBvciBldmVudHMgdG8gdHJhY2sgc3Rha2Vycy4AAAAAAAAMcmVtb3ZlX2VudHJ5AAAAAgAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAAAAAAdzdGFrZXJzAAAAA+oAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    upgrade_core: this.txFromJSON<null>,
        reset_instance: this.txFromJSON<null>,
        reset_entries_chunk: this.txFromJSON<null>,
        entry_count: this.txFromJSON<u32>,
        reset_entry_by_pos: this.txFromJSON<null>,
        init: this.txFromJSON<null>,
        set_base_fee: this.txFromJSON<null>,
        withdraw_xlm_to_treasury: this.txFromJSON<i128>,
        update_oracle_price: this.txFromJSON<null>,
        get_oracle_data: this.txFromJSON<readonly [i128, u64]>,
        get_base_fee: this.txFromJSON<i128>,
        get_total_supply: this.txFromJSON<i128>,
        get_remaining_supply: this.txFromJSON<i128>,
        create_entry: this.txFromJSON<null>,
        record_action: this.txFromJSON<null>,
        get_entry: this.txFromJSON<Option<Entry>>,
        list_entries: this.txFromJSON<Array<string>>,
        get_stake: this.txFromJSON<i128>,
        get_stake_total: this.txFromJSON<i128>,
        distribute_rewards: this.txFromJSON<null>,
        calculate_total_escrow_batch: this.txFromJSON<readonly [u32, i128]>,
        initialize_distribution: this.txFromJSON<null>,
        distribute_rewards_batch: this.txFromJSON<u32>,
        allocate_rewards: this.txFromJSON<null>,
        batch_allocate_rewards: this.txFromJSON<null>,
        claim_rewards: this.txFromJSON<i128>,
        unstake: this.txFromJSON<i128>,
        get_claimable_rewards: this.txFromJSON<i128>,
        get_reward_pool: this.txFromJSON<i128>,
        calculate_apr: this.txFromJSON<i128>,
        get_entry_stats: this.txFromJSON<readonly [i128, i128, i128, i128, i128]>,
        set_artist_equity: this.txFromJSON<null>,
        claim_artist_equity: this.txFromJSON<i128>,
        get_artist_equity: this.txFromJSON<readonly [u32, i128, i128]>,
        get_total_artist_equity: this.txFromJSON<u32>,
        version: this.txFromJSON<u32>,
        merge_entries: this.txFromJSON<null>,
        remove_entry: this.txFromJSON<null>
  }
}