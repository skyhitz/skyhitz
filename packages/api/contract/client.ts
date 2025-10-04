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




export type HitzTokenDataKey = {tag: "HalvingStartTs", values: void} | {tag: "HalvingIntervalSec", values: void} | {tag: "Epoch0Reward", values: void} | {tag: "ReleasedTotal", values: void};

export type DataKey = {tag: "Admin", values: void} | {tag: "Treasury", values: void} | {tag: "HitzToken", values: void} | {tag: "XlmToken", values: void} | {tag: "StakeUnitHitz", values: void} | {tag: "BaseFee", values: void} | {tag: "Entry", values: readonly [string]} | {tag: "Stake", values: readonly [readonly [string, string]]} | {tag: "StakeTotal", values: readonly [string]} | {tag: "RewardPool", values: readonly [string]} | {tag: "Claimed", values: readonly [readonly [string, string]]} | {tag: "EntryAt", values: readonly [u32]} | {tag: "EntryCount", values: void};


export interface Entry {
  created_at: u64;
  escrow_xlm: i128;
  tvl_xlm: i128;
}


/**
 * Storage key for enumeration of accounts per role.
 */
export interface RoleAccountKey {
  index: u32;
  role: string;
}

/**
 * Storage keys for the data associated with the access control
 */
export type AccessControlStorageKey = {tag: "RoleAccounts", values: readonly [RoleAccountKey]} | {tag: "HasRole", values: readonly [string, string]} | {tag: "RoleAccountsCount", values: readonly [string]} | {tag: "RoleAdmin", values: readonly [string]} | {tag: "Admin", values: void} | {tag: "PendingAdmin", values: void};

export const AccessControlError = {
  1210: {message:"Unauthorized"},
  1211: {message:"AdminNotSet"},
  1212: {message:"IndexOutOfBounds"},
  1213: {message:"AdminRoleNotFound"},
  1214: {message:"RoleCountIsNotZero"},
  1215: {message:"RoleNotFound"},
  1216: {message:"AdminAlreadySet"},
  1217: {message:"RoleNotHeld"},
  1218: {message:"RoleIsEmpty"}
}

/**
 * Storage keys for `Ownable` utility.
 */
export type OwnableStorageKey = {tag: "Owner", values: void} | {tag: "PendingOwner", values: void};

export const OwnableError = {
  1220: {message:"OwnerNotSet"},
  1221: {message:"TransferInProgress"},
  1222: {message:"OwnerAlreadySet"}
}

export const RoleTransferError = {
  1200: {message:"NoPendingTransfer"},
  1201: {message:"InvalidLiveUntilLedger"},
  1202: {message:"InvalidPendingAccount"}
}

/**
 * Storage keys for the data associated with the allowlist extension
 */
export type AllowListStorageKey = {tag: "Allowed", values: readonly [string]};

/**
 * Storage keys for the data associated with the blocklist extension
 */
export type BlockListStorageKey = {tag: "Blocked", values: readonly [string]};


/**
 * Storage key that maps to [`AllowanceData`]
 */
export interface AllowanceKey {
  owner: string;
  spender: string;
}


/**
 * Storage container for the amount of tokens for which an allowance is granted
 * and the ledger number at which this allowance expires.
 */
export interface AllowanceData {
  amount: i128;
  live_until_ledger: u32;
}

/**
 * Storage keys for the data associated with `FungibleToken`
 */
export type StorageKey = {tag: "TotalSupply", values: void} | {tag: "Balance", values: readonly [string]} | {tag: "Allowance", values: readonly [AllowanceKey]};


/**
 * Storage container for token metadata
 */
export interface Metadata {
  decimals: u32;
  name: string;
  symbol: string;
}

/**
 * Storage key for accessing the SAC address
 */
export type SACAdminGenericDataKey = {tag: "Sac", values: void};

/**
 * Storage key for accessing the SAC address
 */
export type SACAdminWrapperDataKey = {tag: "Sac", values: void};

export const FungibleTokenError = {
  /**
   * Indicates an error related to the current balance of account from which
   * tokens are expected to be transferred.
   */
  100: {message:"InsufficientBalance"},
  /**
   * Indicates a failure with the allowance mechanism when a given spender
   * doesn't have enough allowance.
   */
  101: {message:"InsufficientAllowance"},
  /**
   * Indicates an invalid value for `live_until_ledger` when setting an
   * allowance.
   */
  102: {message:"InvalidLiveUntilLedger"},
  /**
   * Indicates an error when an input that must be >= 0
   */
  103: {message:"LessThanZero"},
  /**
   * Indicates overflow when adding two values
   */
  104: {message:"MathOverflow"},
  /**
   * Indicates access to uninitialized metadata
   */
  105: {message:"UnsetMetadata"},
  /**
   * Indicates that the operation would have caused `total_supply` to exceed
   * the `cap`.
   */
  106: {message:"ExceededCap"},
  /**
   * Indicates the supplied `cap` is not a valid cap value.
   */
  107: {message:"InvalidCap"},
  /**
   * Indicates the Cap was not set.
   */
  108: {message:"CapNotSet"},
  /**
   * Indicates the SAC address was not set.
   */
  109: {message:"SACNotSet"},
  /**
   * Indicates a SAC address different than expected.
   */
  110: {message:"SACAddressMismatch"},
  /**
   * Indicates a missing function parameter in the SAC contract context.
   */
  111: {message:"SACMissingFnParam"},
  /**
   * Indicates an invalid function parameter in the SAC contract context.
   */
  112: {message:"SACInvalidFnParam"},
  /**
   * The user is not allowed to perform this operation
   */
  113: {message:"UserNotAllowed"},
  /**
   * The user is blocked and cannot perform this operation
   */
  114: {message:"UserBlocked"}
}

/**
 * Storage keys for the data associated with the consecutive extension of
 * `NonFungibleToken`
 */
export type NFTConsecutiveStorageKey = {tag: "Approval", values: readonly [u32]} | {tag: "Owner", values: readonly [u32]} | {tag: "OwnershipBucket", values: readonly [u32]} | {tag: "BurnedToken", values: readonly [u32]};


export interface OwnerTokensKey {
  index: u32;
  owner: string;
}

/**
 * Storage keys for the data associated with the enumerable extension of
 * `NonFungibleToken`
 */
export type NFTEnumerableStorageKey = {tag: "TotalSupply", values: void} | {tag: "OwnerTokens", values: readonly [OwnerTokensKey]} | {tag: "OwnerTokensIndex", values: readonly [u32]} | {tag: "GlobalTokens", values: readonly [u32]} | {tag: "GlobalTokensIndex", values: readonly [u32]};


/**
 * Storage container for royalty information
 */
export interface RoyaltyInfo {
  basis_points: u32;
  receiver: string;
}

/**
 * Storage keys for royalty data
 */
export type NFTRoyaltiesStorageKey = {tag: "DefaultRoyalty", values: void} | {tag: "TokenRoyalty", values: readonly [u32]};


/**
 * Storage container for the token for which an approval is granted
 * and the ledger number at which this approval expires.
 */
export interface ApprovalData {
  approved: string;
  live_until_ledger: u32;
}


/**
 * Storage container for token metadata
 */
export interface Metadata {
  base_uri: string;
  name: string;
  symbol: string;
}

/**
 * Storage keys for the data associated with `NonFungibleToken`
 */
export type NFTStorageKey = {tag: "Owner", values: readonly [u32]} | {tag: "Balance", values: readonly [string]} | {tag: "Approval", values: readonly [u32]} | {tag: "ApprovalForAll", values: readonly [string, string]} | {tag: "Metadata", values: void};

export type NFTSequentialStorageKey = {tag: "TokenIdCounter", values: void};

export const NonFungibleTokenError = {
  /**
   * Indicates a non-existent `token_id`.
   */
  200: {message:"NonExistentToken"},
  /**
   * Indicates an error related to the ownership over a particular token.
   * Used in transfers.
   */
  201: {message:"IncorrectOwner"},
  /**
   * Indicates a failure with the `operator`s approval. Used in transfers.
   */
  202: {message:"InsufficientApproval"},
  /**
   * Indicates a failure with the `approver` of a token to be approved. Used
   * in approvals.
   */
  203: {message:"InvalidApprover"},
  /**
   * Indicates an invalid value for `live_until_ledger` when setting
   * approvals.
   */
  204: {message:"InvalidLiveUntilLedger"},
  /**
   * Indicates overflow when adding two values
   */
  205: {message:"MathOverflow"},
  /**
   * Indicates all possible `token_id`s are already in use.
   */
  206: {message:"TokenIDsAreDepleted"},
  /**
   * Indicates an invalid amount to batch mint in `consecutive` extension.
   */
  207: {message:"InvalidAmount"},
  /**
   * Indicates the token does not exist in owner's list.
   */
  208: {message:"TokenNotFoundInOwnerList"},
  /**
   * Indicates the token does not exist in global list.
   */
  209: {message:"TokenNotFoundInGlobalList"},
  /**
   * Indicates access to unset metadata.
   */
  210: {message:"UnsetMetadata"},
  /**
   * Indicates the length of the base URI exceeds the maximum allowed.
   */
  211: {message:"BaseUriMaxLenExceeded"},
  /**
   * Indicates the royalty amount is higher than 10_000 (100%) basis points.
   */
  212: {message:"InvalidRoyaltyAmount"}
}

export interface Client {
  /**
   * Construct and simulate a mint_reward transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mint reward tokens based on difficulty
   * 
   * Calculates reward using halving schedule and enforces max supply cap.
   * Only callable by owner (Skyhitz Core contract).
   * 
   * # Arguments
   * * `to` - Recipient address
   * * `difficulty` - Difficulty multiplier for reward calculation
   * 
   * # Returns
   * Actual amount minted (may be less than calculated if near max supply)
   */
  mint_reward: ({_caller, to, difficulty}: {_caller: string, to: string, difficulty: i128}, options?: {
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
   * Construct and simulate a emission_info transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get emission info: (epoch_index, current_unit_reward, released_total, remaining_supply)
   */
  emission_info: (options?: {
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
  }) => Promise<AssembledTransaction<readonly [u64, i128, i128, i128]>>

  /**
   * Construct and simulate a max_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get max supply
   */
  max_supply: (options?: {
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
   * Construct and simulate a released_total transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get released total
   */
  released_total: (options?: {
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
   * Construct and simulate a admin_mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin mint (for initial distribution or emergency)
   * Still respects max supply cap
   */
  admin_mint: ({_caller, account, amount}: {_caller: string, account: string, amount: i128}, options?: {
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
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Upgrade contract to new WASM code
   * Only callable by owner (admin)
   */
  upgrade: ({_caller, new_wasm_hash}: {_caller: string, new_wasm_hash: Buffer}, options?: {
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
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer: ({from, to, amount}: {from: string, to: string, amount: i128}, options?: {
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
   * Construct and simulate a transfer_from transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_from: ({spender, from, to, amount}: {spender: string, from: string, to: string, amount: i128}, options?: {
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
   * Construct and simulate a total_supply transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  total_supply: (options?: {
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
   * Construct and simulate a balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  balance: ({account}: {account: string}, options?: {
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
   * Construct and simulate a allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allowance: ({owner, spender}: {owner: string, spender: string}, options?: {
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
   * Construct and simulate a approve transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  approve: ({owner, spender, amount, live_until_ledger}: {owner: string, spender: string, amount: i128, live_until_ledger: u32}, options?: {
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
   * Construct and simulate a decimals transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  decimals: (options?: {
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
   * Construct and simulate a name transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  name: (options?: {
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
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a symbol transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  symbol: (options?: {
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
  }) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner: (options?: {
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
  }) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a transfer_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_ownership: ({new_owner, live_until_ledger}: {new_owner: string, live_until_ledger: u32}, options?: {
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
   * Construct and simulate a accept_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  accept_ownership: (options?: {
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
   * Construct and simulate a renounce_ownership transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  renounce_ownership: (options?: {
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
   * * `treasury` - Treasury address receiving all XLM fees
   * * `hitz_token` - HITZ token contract address (OpenZeppelin token)
   * * `xlm_token` - XLM token contract address (SAC)
   * * `stake_unit_hitz` - HITZ amount per difficulty unit for auto-stake
   * * `base_fee` - Base fee per difficulty unit in stroops (default 100,000 = 0.01 XLM)
   */
  init: ({admin, treasury, hitz_token, xlm_token, stake_unit_hitz, base_fee}: {admin: string, treasury: string, hitz_token: string, xlm_token: string, stake_unit_hitz: i128, base_fee: i128}, options?: {
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
   * Construct and simulate a create_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new entry (admin-only)
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
   * Handles rounding dust by allocating to last entry
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
   * Stakers receive rewards proportional to their stake
   * Formula: claimable = (reward_pool × user_stake) / total_stake - already_claimed
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
   * Get claimable HITZ rewards for a user
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

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {owner, halving_start_ts, halving_interval_sec, epoch0_unit_reward}: {owner: string, halving_start_ts: u64, halving_interval_sec: u64, epoch0_unit_reward: i128},
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
    return ContractClient.deploy({owner, halving_start_ts, halving_interval_sec, epoch0_unit_reward}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAEEhpdHpUb2tlbkRhdGFLZXkAAAAEAAAAAAAAAAAAAAAOSGFsdmluZ1N0YXJ0VHMAAAAAAAAAAAAAAAAAEkhhbHZpbmdJbnRlcnZhbFNlYwAAAAAAAAAAAAAAAAAMRXBvY2gwUmV3YXJkAAAAAAAAAAAAAAANUmVsZWFzZWRUb3RhbAAAAA==",
        "AAAAAAAAAS5Jbml0aWFsaXplIHRoZSBISVRaIHRva2VuCgojIEFyZ3VtZW50cwoqIGBvd25lcmAgLSBBZG1pbiBhZGRyZXNzIHdpdGggcHJpdmlsZWdlZCByaWdodHMKKiBgaGFsdmluZ19zdGFydF90c2AgLSBVbml4IHRpbWVzdGFtcCB3aGVuIGhhbHZpbmcgc2NoZWR1bGUgYmVnaW5zCiogYGhhbHZpbmdfaW50ZXJ2YWxfc2VjYCAtIFNlY29uZHMgcGVyIGVwb2NoICgxMjYsMTQ0LDAwMCA9IDQgeWVhcnMpCiogYGVwb2NoMF91bml0X3Jld2FyZGAgLSBJbml0aWFsIHVuaXQgcmV3YXJkIGluIHN0cm9vcHMgKDMsMDAwLDAwMCA9IDAuMyBISVRaKQAAAAAADV9fY29uc3RydWN0b3IAAAAAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAAEGhhbHZpbmdfc3RhcnRfdHMAAAAGAAAAAAAAABRoYWx2aW5nX2ludGVydmFsX3NlYwAAAAYAAAAAAAAAEmVwb2NoMF91bml0X3Jld2FyZAAAAAAACwAAAAA=",
        "AAAAAAAAAVRNaW50IHJld2FyZCB0b2tlbnMgYmFzZWQgb24gZGlmZmljdWx0eQoKQ2FsY3VsYXRlcyByZXdhcmQgdXNpbmcgaGFsdmluZyBzY2hlZHVsZSBhbmQgZW5mb3JjZXMgbWF4IHN1cHBseSBjYXAuCk9ubHkgY2FsbGFibGUgYnkgb3duZXIgKFNreWhpdHogQ29yZSBjb250cmFjdCkuCgojIEFyZ3VtZW50cwoqIGB0b2AgLSBSZWNpcGllbnQgYWRkcmVzcwoqIGBkaWZmaWN1bHR5YCAtIERpZmZpY3VsdHkgbXVsdGlwbGllciBmb3IgcmV3YXJkIGNhbGN1bGF0aW9uCgojIFJldHVybnMKQWN0dWFsIGFtb3VudCBtaW50ZWQgKG1heSBiZSBsZXNzIHRoYW4gY2FsY3VsYXRlZCBpZiBuZWFyIG1heCBzdXBwbHkpAAAAC21pbnRfcmV3YXJkAAAAAAMAAAAAAAAAB19jYWxsZXIAAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAACmRpZmZpY3VsdHkAAAAAAAsAAAABAAAACw==",
        "AAAAAAAAAFdHZXQgZW1pc3Npb24gaW5mbzogKGVwb2NoX2luZGV4LCBjdXJyZW50X3VuaXRfcmV3YXJkLCByZWxlYXNlZF90b3RhbCwgcmVtYWluaW5nX3N1cHBseSkAAAAADWVtaXNzaW9uX2luZm8AAAAAAAAAAAAAAQAAA+0AAAAEAAAABgAAAAsAAAALAAAACw==",
        "AAAAAAAAAA5HZXQgbWF4IHN1cHBseQAAAAAACm1heF9zdXBwbHkAAAAAAAAAAAABAAAACw==",
        "AAAAAAAAABJHZXQgcmVsZWFzZWQgdG90YWwAAAAAAA5yZWxlYXNlZF90b3RhbAAAAAAAAAAAAAEAAAAL",
        "AAAAAAAAAFBBZG1pbiBtaW50IChmb3IgaW5pdGlhbCBkaXN0cmlidXRpb24gb3IgZW1lcmdlbmN5KQpTdGlsbCByZXNwZWN0cyBtYXggc3VwcGx5IGNhcAAAAAphZG1pbl9taW50AAAAAAADAAAAAAAAAAdfY2FsbGVyAAAAABMAAAAAAAAAB2FjY291bnQAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAEBVcGdyYWRlIGNvbnRyYWN0IHRvIG5ldyBXQVNNIGNvZGUKT25seSBjYWxsYWJsZSBieSBvd25lciAoYWRtaW4pAAAAB3VwZ3JhZGUAAAAAAgAAAAAAAAAHX2NhbGxlcgAAAAATAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAIdHJhbnNmZXIAAAADAAAAAAAAAARmcm9tAAAAEwAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAA=",
        "AAAAAAAAAAAAAAANdHJhbnNmZXJfZnJvbQAAAAAAAAQAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAEZnJvbQAAABMAAAAAAAAAAnRvAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAAMdG90YWxfc3VwcGx5AAAAAAAAAAEAAAAL",
        "AAAAAAAAAAAAAAAHYmFsYW5jZQAAAAABAAAAAAAAAAdhY2NvdW50AAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAJYWxsb3dhbmNlAAAAAAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAdzcGVuZGVyAAAAABMAAAABAAAACw==",
        "AAAAAAAAAAAAAAAHYXBwcm92ZQAAAAAEAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAAB3NwZW5kZXIAAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAABFsaXZlX3VudGlsX2xlZGdlcgAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAIZGVjaW1hbHMAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAEbmFtZQAAAAAAAAABAAAAEA==",
        "AAAAAAAAAAAAAAAGc3ltYm9sAAAAAAAAAAAAAQAAABA=",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAASdHJhbnNmZXJfb3duZXJzaGlwAAAAAAACAAAAAAAAAAluZXdfb3duZXIAAAAAAAATAAAAAAAAABFsaXZlX3VudGlsX2xlZGdlcgAAAAAAAAQAAAAA",
        "AAAAAAAAAAAAAAAQYWNjZXB0X293bmVyc2hpcAAAAAAAAAAA",
        "AAAAAAAAAAAAAAAScmVub3VuY2Vfb3duZXJzaGlwAAAAAAAAAAAAAA==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAIVHJlYXN1cnkAAAAAAAAAAAAAAAlIaXR6VG9rZW4AAAAAAAAAAAAAAAAAAAhYbG1Ub2tlbgAAAAAAAAAAAAAADVN0YWtlVW5pdEhpdHoAAAAAAAAAAAAAAAAAAAdCYXNlRmVlAAAAAAEAAAAAAAAABUVudHJ5AAAAAAAAAQAAABAAAAABAAAAAAAAAAVTdGFrZQAAAAAAAAEAAAPtAAAAAgAAABAAAAATAAAAAQAAAAAAAAAKU3Rha2VUb3RhbAAAAAAAAQAAABAAAAABAAAAAAAAAApSZXdhcmRQb29sAAAAAAABAAAAEAAAAAEAAAAAAAAAB0NsYWltZWQAAAAAAQAAA+0AAAACAAAAEAAAABMAAAABAAAAAAAAAAdFbnRyeUF0AAAAAAEAAAAEAAAAAAAAAAAAAAAKRW50cnlDb3VudAAA",
        "AAAAAQAAAAAAAAAAAAAABUVudHJ5AAAAAAAAAwAAAAAAAAAKY3JlYXRlZF9hdAAAAAAABgAAAAAAAAAKZXNjcm93X3hsbQAAAAAACwAAAAAAAAAHdHZsX3hsbQAAAAAL",
        "AAAAAAAAAahJbml0aWFsaXplIHRoZSBjb250cmFjdCAob25lLXRpbWUgb25seSkKCiMgQXJndW1lbnRzCiogYGFkbWluYCAtIEFkbWluIGFkZHJlc3Mgd2l0aCBwcml2aWxlZ2VkIHJpZ2h0cwoqIGB0cmVhc3VyeWAgLSBUcmVhc3VyeSBhZGRyZXNzIHJlY2VpdmluZyBhbGwgWExNIGZlZXMKKiBgaGl0el90b2tlbmAgLSBISVRaIHRva2VuIGNvbnRyYWN0IGFkZHJlc3MgKE9wZW5aZXBwZWxpbiB0b2tlbikKKiBgeGxtX3Rva2VuYCAtIFhMTSB0b2tlbiBjb250cmFjdCBhZGRyZXNzIChTQUMpCiogYHN0YWtlX3VuaXRfaGl0emAgLSBISVRaIGFtb3VudCBwZXIgZGlmZmljdWx0eSB1bml0IGZvciBhdXRvLXN0YWtlCiogYGJhc2VfZmVlYCAtIEJhc2UgZmVlIHBlciBkaWZmaWN1bHR5IHVuaXQgaW4gc3Ryb29wcyAoZGVmYXVsdCAxMDAsMDAwID0gMC4wMSBYTE0pAAAABGluaXQAAAAGAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAACHRyZWFzdXJ5AAAAEwAAAAAAAAAKaGl0el90b2tlbgAAAAAAEwAAAAAAAAAJeGxtX3Rva2VuAAAAAAAAEwAAAAAAAAAPc3Rha2VfdW5pdF9oaXR6AAAAAAsAAAAAAAAACGJhc2VfZmVlAAAACwAAAAA=",
        "AAAAAAAAAINVcGRhdGUgYmFzZSBmZWUgKGFkbWluLW9ubHkpCgojIEFyZ3VtZW50cwoqIGBuZXdfYmFzZV9mZWVgIC0gTmV3IGJhc2UgZmVlIHBlciBkaWZmaWN1bHR5IHVuaXQgaW4gc3Ryb29wcyAoZS5nLiwgMTAwLDAwMCA9IDAuMDEgWExNKQAAAAAMc2V0X2Jhc2VfZmVlAAAAAQAAAAAAAAAMbmV3X2Jhc2VfZmVlAAAACwAAAAA=",
        "AAAAAAAAABRHZXQgY3VycmVudCBiYXNlIGZlZQAAAAxnZXRfYmFzZV9mZWUAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAB9DcmVhdGUgYSBuZXcgZW50cnkgKGFkbWluLW9ubHkpAAAAAAxjcmVhdGVfZW50cnkAAAABAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAA",
        "AAAAAAAAAMtSZWNvcmQgYSB1c2VyIGFjdGlvbiAobWFpbiBlbnRyeXBvaW50KQoKSGFuZGxlcyBmZWUgdHJhbnNmZXIsIHJld2FyZCBjYWxjdWxhdGlvbiwgYW5kIG9wdGlvbmFsIGF1dG8tc3Rha2luZwpGb3IgaW52ZXN0IGFjdGlvbiwgYW1vdW50X3hsbSBzcGVjaWZpZXMgdGhlIGludmVzdG1lbnQgKG1pbiAwLjMgWExNKSwgaWdub3JlZCBmb3Igb3RoZXIgYWN0aW9ucwAAAAANcmVjb3JkX2FjdGlvbgAAAAAAAAQAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAAAAAARraW5kAAAAEQAAAAAAAAAKYW1vdW50X3hsbQAAAAAD6AAAAAsAAAAA",
        "AAAAAAAAAA5HZXQgZW50cnkgZGF0YQAAAAAACWdldF9lbnRyeQAAAAAAAAEAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAEAAAPoAAAH0AAAAAVFbnRyeQAAAA==",
        "AAAAAAAAAB5MaXN0IGVudHJ5IElEcyB3aXRoIHBhZ2luYXRpb24AAAAAAAxsaXN0X2VudHJpZXMAAAACAAAAAAAAAAVzdGFydAAAAAAAAAQAAAAAAAAABWxpbWl0AAAAAAAABAAAAAEAAAPqAAAAEA==",
        "AAAAAAAAAB1HZXQgdXNlcidzIHN0YWtlIGZvciBhbiBlbnRyeQAAAAAAAAlnZXRfc3Rha2UAAAAAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAAL",
        "AAAAAAAAABxHZXQgdG90YWwgc3Rha2UgZm9yIGFuIGVudHJ5AAAAD2dldF9zdGFrZV90b3RhbAAAAAABAAAAAAAAAAhlbnRyeV9pZAAAABAAAAABAAAACw==",
        "AAAAAAAAAdxDb250cmFjdCB2ZXJzaW9uCkRpc3RyaWJ1dGUgSElUWiByZXdhcmRzIHByb3BvcnRpb25hbGx5IGJhc2VkIG9uIGVzY3JvdyBwZXJmb3JtYW5jZQoKVHJlYXN1cnkgYm90IGNhbGxzIHRoaXMgYWZ0ZXIgYnV5aW5nIEhJVFogd2l0aCBhY2N1bXVsYXRlZCBYTE0gZmVlcy4KQ29udHJhY3QgYXV0b21hdGljYWxseSBkaXN0cmlidXRlcyB0byBlbnRyaWVzIGJhc2VkIG9uIHRoZWlyIGVzY3Jvd194bG0uCgojIEFyZ3VtZW50cwoqIGBjYWxsZXJgIC0gVHJlYXN1cnkgYWRkcmVzcyB0aGF0IGhvbGRzIHRoZSBISVRaCiogYGhpdHpfYW1vdW50YCAtIFRvdGFsIEhJVFogdG8gZGlzdHJpYnV0ZSBhY3Jvc3MgYWxsIGVudHJpZXMKCiMgUGVyZm9ybWFuY2UKT3B0aW1pemVkIHRvIHNpbmdsZSBsb29wIC0gTyhuKSB3aGVyZSBuID0gbnVtYmVyIG9mIGVudHJpZXMKSGFuZGxlcyByb3VuZGluZyBkdXN0IGJ5IGFsbG9jYXRpbmcgdG8gbGFzdCBlbnRyeQAAABJkaXN0cmlidXRlX3Jld2FyZHMAAAAAAAIAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAALaGl0el9hbW91bnQAAAAACwAAAAA=",
        "AAAAAAAAAIVBbGxvY2F0ZSBISVRaIHJld2FyZHMgdG8gYSBzcGVjaWZpYyBlbnRyeSdzIHJld2FyZCBwb29sCgpBZG1pbi1vbmx5IGZ1bmN0aW9uIGZvciBtYW51YWwgcmV3YXJkIGFsbG9jYXRpb24gKGUuZy4sIHByb21vdGlvbnMsIGJvbnVzZXMpAAAAAAAAEGFsbG9jYXRlX3Jld2FyZHMAAAACAAAAAAAAAAhlbnRyeV9pZAAAABAAAAAAAAAAC2hpdHpfYW1vdW50AAAAAAsAAAAA",
        "AAAAAAAAAHdCYXRjaCBhbGxvY2F0ZSByZXdhcmRzIHRvIG11bHRpcGxlIGVudHJpZXMKCkFkbWluLW9ubHkgZnVuY3Rpb24gZm9yIG1hbnVhbCBiYXRjaCBhbGxvY2F0aW9uIChlLmcuLCBjYW1wYWlnbnMsIGFpcmRyb3BzKQAAAAAWYmF0Y2hfYWxsb2NhdGVfcmV3YXJkcwAAAAAAAgAAAAAAAAAJZW50cnlfaWRzAAAAAAAD6gAAABAAAAAAAAAAB2Ftb3VudHMAAAAD6gAAAAsAAAAA",
        "AAAAAAAAALRDbGFpbSBISVRaIHJld2FyZHMgZnJvbSBhbiBlbnRyeSdzIHJld2FyZCBwb29sCgpTdGFrZXJzIHJlY2VpdmUgcmV3YXJkcyBwcm9wb3J0aW9uYWwgdG8gdGhlaXIgc3Rha2UKRm9ybXVsYTogY2xhaW1hYmxlID0gKHJld2FyZF9wb29sIMOXIHVzZXJfc3Rha2UpIC8gdG90YWxfc3Rha2UgLSBhbHJlYWR5X2NsYWltZWQAAAANY2xhaW1fcmV3YXJkcwAAAAAAAAIAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAAAAAAHY2xhaW1lcgAAAAATAAAAAQAAAAs=",
        "AAAAAAAAAbNVbnN0YWtlIEhJVFogdG9rZW5zIGZyb20gYW4gZW50cnkKCkFsbG93cyB1c2VycyB0byB3aXRoZHJhdyB0aGVpciBzdGFrZWQgSElUWiBiYWNrIHRvIHRoZWlyIHdhbGxldC4KVXNlciBsb3NlcyB0aGVpciBzdGFrZSBwZXJjZW50YWdlIGFuZCBmdXR1cmUgcmV3YXJkcyBmcm9tIHRoaXMgZW50cnkuCgojIEFyZ3VtZW50cwoqIGBlbnRyeV9pZGAgLSBUaGUgZW50cnkgdG8gdW5zdGFrZSBmcm9tCiogYGNhbGxlcmAgLSBUaGUgdXNlciB1bnN0YWtpbmcgKG11c3QgaGF2ZSBzdGFrZSkKKiBgYW1vdW50YCAtIEFtb3VudCBvZiBISVRaIHRvIHVuc3Rha2UgKGluIHN0cm9vcHMpCgojIFJldHVybnMKQW1vdW50IHVuc3Rha2VkCgojIFBhbmljcwotIElmIHVzZXIgaGFzIG5vIHN0YWtlCi0gSWYgYW1vdW50IGV4Y2VlZHMgdXNlcidzIHN0YWtlCi0gSWYgYW1vdW50IDw9IDAAAAAAB3Vuc3Rha2UAAAAAAwAAAAAAAAAIZW50cnlfaWQAAAAQAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAEAAAAL",
        "AAAAAAAAACVHZXQgY2xhaW1hYmxlIEhJVFogcmV3YXJkcyBmb3IgYSB1c2VyAAAAAAAAFWdldF9jbGFpbWFibGVfcmV3YXJkcwAAAAAAAAIAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAAAAAAEdXNlcgAAABMAAAABAAAACw==",
        "AAAAAAAAACFHZXQgcmV3YXJkIHBvb2wgc2l6ZSBmb3IgYW4gZW50cnkAAAAAAAAPZ2V0X3Jld2FyZF9wb29sAAAAAAEAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAEAAAAL",
        "AAAAAAAAAKxDYWxjdWxhdGUgQVBSIGZvciBhbiBlbnRyeSBiYXNlZCBvbiBISVRaIHJld2FyZHMKCkFQUiA9ICgocmV3YXJkX3Bvb2wgLyB0b3RhbF9zdGFrZSkgLyBkYXlzX3NpbmNlX2NyZWF0aW9uKSDDlyAzNjUgw5cgMTAwClJldHVybnMgQVBSIGFzIGJhc2lzIHBvaW50cyAoMSUgPSAxMDAsIDEwJSA9IDEwMDApAAAADWNhbGN1bGF0ZV9hcHIAAAAAAAABAAAAAAAAAAhlbnRyeV9pZAAAABAAAAABAAAACw==",
        "AAAAAAAAAIRHZXQgY29tcHJlaGVuc2l2ZSBlbnRyeSBzdGF0aXN0aWNzIGZvciByYW5raW5nCgpSZXR1cm5zOiAodHZsX3hsbSwgZXNjcm93X3hsbSwgdG90YWxfc3Rha2VfaGl0eiwgcmV3YXJkX3Bvb2xfaGl0eiwgYXByX2Jhc2lzX3BvaW50cykAAAAPZ2V0X2VudHJ5X3N0YXRzAAAAAAEAAAAAAAAACGVudHJ5X2lkAAAAEAAAAAEAAAPtAAAABQAAAAsAAAALAAAACwAAAAsAAAAL",
        "AAAAAAAAAAAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAQAAADFTdG9yYWdlIGtleSBmb3IgZW51bWVyYXRpb24gb2YgYWNjb3VudHMgcGVyIHJvbGUuAAAAAAAAAAAAAA5Sb2xlQWNjb3VudEtleQAAAAAAAgAAAAAAAAAFaW5kZXgAAAAAAAAEAAAAAAAAAARyb2xlAAAAEQ==",
        "AAAAAgAAADxTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYWNjZXNzIGNvbnRyb2wAAAAAAAAAF0FjY2Vzc0NvbnRyb2xTdG9yYWdlS2V5AAAAAAYAAAABAAAAAAAAAAxSb2xlQWNjb3VudHMAAAABAAAH0AAAAA5Sb2xlQWNjb3VudEtleQAAAAAAAQAAAAAAAAAHSGFzUm9sZQAAAAACAAAAEwAAABEAAAABAAAAAAAAABFSb2xlQWNjb3VudHNDb3VudAAAAAAAAAEAAAARAAAAAQAAAAAAAAAJUm9sZUFkbWluAAAAAAAAAQAAABEAAAAAAAAAAAAAAAVBZG1pbgAAAAAAAAAAAAAAAAAADFBlbmRpbmdBZG1pbg==",
        "AAAABAAAAAAAAAAAAAAAEkFjY2Vzc0NvbnRyb2xFcnJvcgAAAAAACQAAAAAAAAAMVW5hdXRob3JpemVkAAAEugAAAAAAAAALQWRtaW5Ob3RTZXQAAAAEuwAAAAAAAAAQSW5kZXhPdXRPZkJvdW5kcwAABLwAAAAAAAAAEUFkbWluUm9sZU5vdEZvdW5kAAAAAAAEvQAAAAAAAAASUm9sZUNvdW50SXNOb3RaZXJvAAAAAAS+AAAAAAAAAAxSb2xlTm90Rm91bmQAAAS/AAAAAAAAAA9BZG1pbkFscmVhZHlTZXQAAAAEwAAAAAAAAAALUm9sZU5vdEhlbGQAAAAEwQAAAAAAAAALUm9sZUlzRW1wdHkAAAAEwg==",
        "AAAAAgAAACNTdG9yYWdlIGtleXMgZm9yIGBPd25hYmxlYCB1dGlsaXR5LgAAAAAAAAAAEU93bmFibGVTdG9yYWdlS2V5AAAAAAAAAgAAAAAAAAAAAAAABU93bmVyAAAAAAAAAAAAAAAAAAAMUGVuZGluZ093bmVy",
        "AAAABAAAAAAAAAAAAAAADE93bmFibGVFcnJvcgAAAAMAAAAAAAAAC093bmVyTm90U2V0AAAABMQAAAAAAAAAElRyYW5zZmVySW5Qcm9ncmVzcwAAAAAExQAAAAAAAAAPT3duZXJBbHJlYWR5U2V0AAAABMY=",
        "AAAABAAAAAAAAAAAAAAAEVJvbGVUcmFuc2ZlckVycm9yAAAAAAAAAwAAAAAAAAARTm9QZW5kaW5nVHJhbnNmZXIAAAAAAASwAAAAAAAAABZJbnZhbGlkTGl2ZVVudGlsTGVkZ2VyAAAAAASxAAAAAAAAABVJbnZhbGlkUGVuZGluZ0FjY291bnQAAAAAAASy",
        "AAAAAgAAAEFTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYWxsb3dsaXN0IGV4dGVuc2lvbgAAAAAAAAAAAAATQWxsb3dMaXN0U3RvcmFnZUtleQAAAAABAAAAAQAAACdTdG9yZXMgdGhlIGFsbG93ZWQgc3RhdHVzIG9mIGFuIGFjY291bnQAAAAAB0FsbG93ZWQAAAAAAQAAABM=",
        "AAAAAgAAAEFTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgYmxvY2tsaXN0IGV4dGVuc2lvbgAAAAAAAAAAAAATQmxvY2tMaXN0U3RvcmFnZUtleQAAAAABAAAAAQAAACdTdG9yZXMgdGhlIGJsb2NrZWQgc3RhdHVzIG9mIGFuIGFjY291bnQAAAAAB0Jsb2NrZWQAAAAAAQAAABM=",
        "AAAAAQAAACpTdG9yYWdlIGtleSB0aGF0IG1hcHMgdG8gW2BBbGxvd2FuY2VEYXRhYF0AAAAAAAAAAAAMQWxsb3dhbmNlS2V5AAAAAgAAAAAAAAAFb3duZXIAAAAAAAATAAAAAAAAAAdzcGVuZGVyAAAAABM=",
        "AAAAAQAAAINTdG9yYWdlIGNvbnRhaW5lciBmb3IgdGhlIGFtb3VudCBvZiB0b2tlbnMgZm9yIHdoaWNoIGFuIGFsbG93YW5jZSBpcyBncmFudGVkCmFuZCB0aGUgbGVkZ2VyIG51bWJlciBhdCB3aGljaCB0aGlzIGFsbG93YW5jZSBleHBpcmVzLgAAAAAAAAAADUFsbG93YW5jZURhdGEAAAAAAAACAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEWxpdmVfdW50aWxfbGVkZ2VyAAAAAAAABA==",
        "AAAAAgAAADlTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCBgRnVuZ2libGVUb2tlbmAAAAAAAAAAAAAAClN0b3JhZ2VLZXkAAAAAAAMAAAAAAAAAAAAAAAtUb3RhbFN1cHBseQAAAAABAAAAAAAAAAdCYWxhbmNlAAAAAAEAAAATAAAAAQAAAAAAAAAJQWxsb3dhbmNlAAAAAAAAAQAAB9AAAAAMQWxsb3dhbmNlS2V5",
        "AAAAAQAAACRTdG9yYWdlIGNvbnRhaW5lciBmb3IgdG9rZW4gbWV0YWRhdGEAAAAAAAAACE1ldGFkYXRhAAAAAwAAAAAAAAAIZGVjaW1hbHMAAAAEAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQ",
        "AAAAAgAAAClTdG9yYWdlIGtleSBmb3IgYWNjZXNzaW5nIHRoZSBTQUMgYWRkcmVzcwAAAAAAAAAAAAAWU0FDQWRtaW5HZW5lcmljRGF0YUtleQAAAAAAAQAAAAAAAAAAAAAAA1NhYwA=",
        "AAAAAgAAAClTdG9yYWdlIGtleSBmb3IgYWNjZXNzaW5nIHRoZSBTQUMgYWRkcmVzcwAAAAAAAAAAAAAWU0FDQWRtaW5XcmFwcGVyRGF0YUtleQAAAAAAAQAAAAAAAAAAAAAAA1NhYwA=",
        "AAAABAAAAAAAAAAAAAAAEkZ1bmdpYmxlVG9rZW5FcnJvcgAAAAAADwAAAG5JbmRpY2F0ZXMgYW4gZXJyb3IgcmVsYXRlZCB0byB0aGUgY3VycmVudCBiYWxhbmNlIG9mIGFjY291bnQgZnJvbSB3aGljaAp0b2tlbnMgYXJlIGV4cGVjdGVkIHRvIGJlIHRyYW5zZmVycmVkLgAAAAAAE0luc3VmZmljaWVudEJhbGFuY2UAAAAAZAAAAGRJbmRpY2F0ZXMgYSBmYWlsdXJlIHdpdGggdGhlIGFsbG93YW5jZSBtZWNoYW5pc20gd2hlbiBhIGdpdmVuIHNwZW5kZXIKZG9lc24ndCBoYXZlIGVub3VnaCBhbGxvd2FuY2UuAAAAFUluc3VmZmljaWVudEFsbG93YW5jZQAAAAAAAGUAAABNSW5kaWNhdGVzIGFuIGludmFsaWQgdmFsdWUgZm9yIGBsaXZlX3VudGlsX2xlZGdlcmAgd2hlbiBzZXR0aW5nIGFuCmFsbG93YW5jZS4AAAAAAAAWSW52YWxpZExpdmVVbnRpbExlZGdlcgAAAAAAZgAAADJJbmRpY2F0ZXMgYW4gZXJyb3Igd2hlbiBhbiBpbnB1dCB0aGF0IG11c3QgYmUgPj0gMAAAAAAADExlc3NUaGFuWmVybwAAAGcAAAApSW5kaWNhdGVzIG92ZXJmbG93IHdoZW4gYWRkaW5nIHR3byB2YWx1ZXMAAAAAAAAMTWF0aE92ZXJmbG93AAAAaAAAACpJbmRpY2F0ZXMgYWNjZXNzIHRvIHVuaW5pdGlhbGl6ZWQgbWV0YWRhdGEAAAAAAA1VbnNldE1ldGFkYXRhAAAAAAAAaQAAAFJJbmRpY2F0ZXMgdGhhdCB0aGUgb3BlcmF0aW9uIHdvdWxkIGhhdmUgY2F1c2VkIGB0b3RhbF9zdXBwbHlgIHRvIGV4Y2VlZAp0aGUgYGNhcGAuAAAAAAALRXhjZWVkZWRDYXAAAAAAagAAADZJbmRpY2F0ZXMgdGhlIHN1cHBsaWVkIGBjYXBgIGlzIG5vdCBhIHZhbGlkIGNhcCB2YWx1ZS4AAAAAAApJbnZhbGlkQ2FwAAAAAABrAAAAHkluZGljYXRlcyB0aGUgQ2FwIHdhcyBub3Qgc2V0LgAAAAAACUNhcE5vdFNldAAAAAAAAGwAAAAmSW5kaWNhdGVzIHRoZSBTQUMgYWRkcmVzcyB3YXMgbm90IHNldC4AAAAAAAlTQUNOb3RTZXQAAAAAAABtAAAAMEluZGljYXRlcyBhIFNBQyBhZGRyZXNzIGRpZmZlcmVudCB0aGFuIGV4cGVjdGVkLgAAABJTQUNBZGRyZXNzTWlzbWF0Y2gAAAAAAG4AAABDSW5kaWNhdGVzIGEgbWlzc2luZyBmdW5jdGlvbiBwYXJhbWV0ZXIgaW4gdGhlIFNBQyBjb250cmFjdCBjb250ZXh0LgAAAAARU0FDTWlzc2luZ0ZuUGFyYW0AAAAAAABvAAAAREluZGljYXRlcyBhbiBpbnZhbGlkIGZ1bmN0aW9uIHBhcmFtZXRlciBpbiB0aGUgU0FDIGNvbnRyYWN0IGNvbnRleHQuAAAAEVNBQ0ludmFsaWRGblBhcmFtAAAAAAAAcAAAADFUaGUgdXNlciBpcyBub3QgYWxsb3dlZCB0byBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uAAAAAAAADlVzZXJOb3RBbGxvd2VkAAAAAABxAAAANVRoZSB1c2VyIGlzIGJsb2NrZWQgYW5kIGNhbm5vdCBwZXJmb3JtIHRoaXMgb3BlcmF0aW9uAAAAAAAAC1VzZXJCbG9ja2VkAAAAAHI=",
        "AAAAAgAAAFlTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29uc2VjdXRpdmUgZXh0ZW5zaW9uIG9mCmBOb25GdW5naWJsZVRva2VuYAAAAAAAAAAAAAAYTkZUQ29uc2VjdXRpdmVTdG9yYWdlS2V5AAAABAAAAAEAAAAAAAAACEFwcHJvdmFsAAAAAQAAAAQAAAABAAAAAAAAAAVPd25lcgAAAAAAAAEAAAAEAAAAAQAAAAAAAAAPT3duZXJzaGlwQnVja2V0AAAAAAEAAAAEAAAAAQAAAAAAAAALQnVybmVkVG9rZW4AAAAAAQAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAADk93bmVyVG9rZW5zS2V5AAAAAAACAAAAAAAAAAVpbmRleAAAAAAAAAQAAAAAAAAABW93bmVyAAAAAAAAEw==",
        "AAAAAgAAAFhTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgZW51bWVyYWJsZSBleHRlbnNpb24gb2YKYE5vbkZ1bmdpYmxlVG9rZW5gAAAAAAAAABdORlRFbnVtZXJhYmxlU3RvcmFnZUtleQAAAAAFAAAAAAAAAAAAAAALVG90YWxTdXBwbHkAAAAAAQAAAAAAAAALT3duZXJUb2tlbnMAAAAAAQAAB9AAAAAOT3duZXJUb2tlbnNLZXkAAAAAAAEAAAAAAAAAEE93bmVyVG9rZW5zSW5kZXgAAAABAAAABAAAAAEAAAAAAAAADEdsb2JhbFRva2VucwAAAAEAAAAEAAAAAQAAAAAAAAARR2xvYmFsVG9rZW5zSW5kZXgAAAAAAAABAAAABA==",
        "AAAAAQAAAClTdG9yYWdlIGNvbnRhaW5lciBmb3Igcm95YWx0eSBpbmZvcm1hdGlvbgAAAAAAAAAAAAALUm95YWx0eUluZm8AAAAAAgAAAAAAAAAMYmFzaXNfcG9pbnRzAAAABAAAAAAAAAAIcmVjZWl2ZXIAAAAT",
        "AAAAAgAAAB1TdG9yYWdlIGtleXMgZm9yIHJveWFsdHkgZGF0YQAAAAAAAAAAAAAWTkZUUm95YWx0aWVzU3RvcmFnZUtleQAAAAAAAgAAAAAAAAAAAAAADkRlZmF1bHRSb3lhbHR5AAAAAAABAAAAAAAAAAxUb2tlblJveWFsdHkAAAABAAAABA==",
        "AAAAAQAAAHZTdG9yYWdlIGNvbnRhaW5lciBmb3IgdGhlIHRva2VuIGZvciB3aGljaCBhbiBhcHByb3ZhbCBpcyBncmFudGVkCmFuZCB0aGUgbGVkZ2VyIG51bWJlciBhdCB3aGljaCB0aGlzIGFwcHJvdmFsIGV4cGlyZXMuAAAAAAAAAAAADEFwcHJvdmFsRGF0YQAAAAIAAAAAAAAACGFwcHJvdmVkAAAAEwAAAAAAAAARbGl2ZV91bnRpbF9sZWRnZXIAAAAAAAAE",
        "AAAAAQAAACRTdG9yYWdlIGNvbnRhaW5lciBmb3IgdG9rZW4gbWV0YWRhdGEAAAAAAAAACE1ldGFkYXRhAAAAAwAAAAAAAAAIYmFzZV91cmkAAAAQAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAGc3ltYm9sAAAAAAAQ",
        "AAAAAgAAADxTdG9yYWdlIGtleXMgZm9yIHRoZSBkYXRhIGFzc29jaWF0ZWQgd2l0aCBgTm9uRnVuZ2libGVUb2tlbmAAAAAAAAAADU5GVFN0b3JhZ2VLZXkAAAAAAAAFAAAAAQAAAAAAAAAFT3duZXIAAAAAAAABAAAABAAAAAEAAAAAAAAAB0JhbGFuY2UAAAAAAQAAABMAAAABAAAAAAAAAAhBcHByb3ZhbAAAAAEAAAAEAAAAAQAAAAAAAAAOQXBwcm92YWxGb3JBbGwAAAAAAAIAAAATAAAAEwAAAAAAAAAAAAAACE1ldGFkYXRh",
        "AAAAAgAAAAAAAAAAAAAAF05GVFNlcXVlbnRpYWxTdG9yYWdlS2V5AAAAAAEAAAAAAAAAAAAAAA5Ub2tlbklkQ291bnRlcgAA",
        "AAAABAAAAAAAAAAAAAAAFU5vbkZ1bmdpYmxlVG9rZW5FcnJvcgAAAAAAAA0AAAAkSW5kaWNhdGVzIGEgbm9uLWV4aXN0ZW50IGB0b2tlbl9pZGAuAAAAEE5vbkV4aXN0ZW50VG9rZW4AAADIAAAAV0luZGljYXRlcyBhbiBlcnJvciByZWxhdGVkIHRvIHRoZSBvd25lcnNoaXAgb3ZlciBhIHBhcnRpY3VsYXIgdG9rZW4uClVzZWQgaW4gdHJhbnNmZXJzLgAAAAAOSW5jb3JyZWN0T3duZXIAAAAAAMkAAABFSW5kaWNhdGVzIGEgZmFpbHVyZSB3aXRoIHRoZSBgb3BlcmF0b3JgcyBhcHByb3ZhbC4gVXNlZCBpbiB0cmFuc2ZlcnMuAAAAAAAAFEluc3VmZmljaWVudEFwcHJvdmFsAAAAygAAAFVJbmRpY2F0ZXMgYSBmYWlsdXJlIHdpdGggdGhlIGBhcHByb3ZlcmAgb2YgYSB0b2tlbiB0byBiZSBhcHByb3ZlZC4gVXNlZAppbiBhcHByb3ZhbHMuAAAAAAAAD0ludmFsaWRBcHByb3ZlcgAAAADLAAAASkluZGljYXRlcyBhbiBpbnZhbGlkIHZhbHVlIGZvciBgbGl2ZV91bnRpbF9sZWRnZXJgIHdoZW4gc2V0dGluZwphcHByb3ZhbHMuAAAAAAAWSW52YWxpZExpdmVVbnRpbExlZGdlcgAAAAAAzAAAAClJbmRpY2F0ZXMgb3ZlcmZsb3cgd2hlbiBhZGRpbmcgdHdvIHZhbHVlcwAAAAAAAAxNYXRoT3ZlcmZsb3cAAADNAAAANkluZGljYXRlcyBhbGwgcG9zc2libGUgYHRva2VuX2lkYHMgYXJlIGFscmVhZHkgaW4gdXNlLgAAAAAAE1Rva2VuSURzQXJlRGVwbGV0ZWQAAAAAzgAAAEVJbmRpY2F0ZXMgYW4gaW52YWxpZCBhbW91bnQgdG8gYmF0Y2ggbWludCBpbiBgY29uc2VjdXRpdmVgIGV4dGVuc2lvbi4AAAAAAAANSW52YWxpZEFtb3VudAAAAAAAAM8AAAAzSW5kaWNhdGVzIHRoZSB0b2tlbiBkb2VzIG5vdCBleGlzdCBpbiBvd25lcidzIGxpc3QuAAAAABhUb2tlbk5vdEZvdW5kSW5Pd25lckxpc3QAAADQAAAAMkluZGljYXRlcyB0aGUgdG9rZW4gZG9lcyBub3QgZXhpc3QgaW4gZ2xvYmFsIGxpc3QuAAAAAAAZVG9rZW5Ob3RGb3VuZEluR2xvYmFsTGlzdAAAAAAAANEAAAAjSW5kaWNhdGVzIGFjY2VzcyB0byB1bnNldCBtZXRhZGF0YS4AAAAADVVuc2V0TWV0YWRhdGEAAAAAAADSAAAAQUluZGljYXRlcyB0aGUgbGVuZ3RoIG9mIHRoZSBiYXNlIFVSSSBleGNlZWRzIHRoZSBtYXhpbXVtIGFsbG93ZWQuAAAAAAAAFUJhc2VVcmlNYXhMZW5FeGNlZWRlZAAAAAAAANMAAABHSW5kaWNhdGVzIHRoZSByb3lhbHR5IGFtb3VudCBpcyBoaWdoZXIgdGhhbiAxMF8wMDAgKDEwMCUpIGJhc2lzIHBvaW50cy4AAAAAFEludmFsaWRSb3lhbHR5QW1vdW50AAAA1A==" ]),
      options
    )
  }
  public readonly fromJSON = {
    mint_reward: this.txFromJSON<i128>,
        emission_info: this.txFromJSON<readonly [u64, i128, i128, i128]>,
        max_supply: this.txFromJSON<i128>,
        released_total: this.txFromJSON<i128>,
        admin_mint: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>,
        transfer: this.txFromJSON<null>,
        transfer_from: this.txFromJSON<null>,
        total_supply: this.txFromJSON<i128>,
        balance: this.txFromJSON<i128>,
        allowance: this.txFromJSON<i128>,
        approve: this.txFromJSON<null>,
        decimals: this.txFromJSON<u32>,
        name: this.txFromJSON<string>,
        symbol: this.txFromJSON<string>,
        get_owner: this.txFromJSON<Option<string>>,
        transfer_ownership: this.txFromJSON<null>,
        accept_ownership: this.txFromJSON<null>,
        renounce_ownership: this.txFromJSON<null>,
        init: this.txFromJSON<null>,
        set_base_fee: this.txFromJSON<null>,
        get_base_fee: this.txFromJSON<i128>,
        create_entry: this.txFromJSON<null>,
        record_action: this.txFromJSON<null>,
        get_entry: this.txFromJSON<Option<Entry>>,
        list_entries: this.txFromJSON<Array<string>>,
        get_stake: this.txFromJSON<i128>,
        get_stake_total: this.txFromJSON<i128>,
        distribute_rewards: this.txFromJSON<null>,
        allocate_rewards: this.txFromJSON<null>,
        batch_allocate_rewards: this.txFromJSON<null>,
        claim_rewards: this.txFromJSON<i128>,
        unstake: this.txFromJSON<i128>,
        get_claimable_rewards: this.txFromJSON<i128>,
        get_reward_pool: this.txFromJSON<i128>,
        calculate_apr: this.txFromJSON<i128>,
        get_entry_stats: this.txFromJSON<readonly [i128, i128, i128, i128, i128]>,
        version: this.txFromJSON<u32>
  }
}