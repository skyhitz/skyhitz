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




export type DataKey = {tag: "Index", values: void} | {tag: "Entries", values: readonly [string]} | {tag: "Network", values: void} | {tag: "Admin", values: void};


export interface Entry {
  apr: i128;
  escrow: i128;
  id: string;
  share_since: Map<string, i128>;
  shares: Map<string, i128>;
  tvl: i128;
  withdrawn_earnings: Map<string, i128>;
}

export const Errors = {

}

export interface Client {
  /**
   * Construct and simulate a set_entry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Stores or replaces an `Entry` by id and appends the id to the global
   * index. Only callable by `Admin`.
   */
  set_entry: ({entry}: {entry: Entry}, options?: {
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
   * Removes an `Entry` by id and updates the global index. Only callable
   * by `Admin`. Panics if the entry does not exist.
   */
  remove_entry: ({id}: {id: string}, options?: {
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
   * Returns an `Entry` by id. Panics if the entry does not exist.
   */
  get_entry: ({id}: {id: string}, options?: {
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
  }) => Promise<AssembledTransaction<Entry>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Bumps when contract logic changes in a way that clients may care about.
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
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * One-time initialization of admin, network, and optional entry ids.
   * 
   * - `admin`: Address with privileged rights (set/remove/upgrade).
   * - `network`: Must be "public" or "testnet".
   * - `ids`: Optional seed list of entry ids to create with zeroed values.
   * 
   * Panics if called more than once or if network is invalid.
   */
  init: ({admin, network, ids}: {admin: string, network: string, ids: Array<string>}, options?: {
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
   * Upgrades the contract code. Only callable by `Admin`.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: {
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
   * Construct and simulate a invest transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Invest tokens into an entry.
   * 
   * Behavior:
   * - Transfers `amount` from `user` to the contract.
   * - Always increases `escrow` by `amount`.
   * - If `amount` > `download_amount` threshold, increases user equity
   * shares and `tvl` by `amount`.
   * - Recomputes APR.
   * - Lazily creates the entry if it does not exist, and ensures it’s
   * listed in the global index.
   */
  invest: ({user, id, amount}: {user: string, id: string, amount: i128}, options?: {
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
   * Construct and simulate a claim_earnings transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim the caller's proportional earnings for an entry.
   * 
   * Earnings are defined as `escrow - tvl` when positive. The user's
   * proportional share is `(user_shares / tvl) * total_earnings`, adjusted
   * by previously withdrawn amounts. Transfers the claimable amount to the
   * user and persists updated accounting. Returns the claimed amount.
   */
  claim_earnings: ({user, id}: {user: string, id: string}, options?: {
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
   * Construct and simulate a sell_shares transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Sell a portion of the caller's equity shares for an entry.
   * 
   * Behavior:
   * - Requires the caller to have at least `amount` shares.
   * - Decreases user's shares and entry `tvl` by `amount`.
   * - Does NOT change this entry's `escrow`.
   * - Computes commission based on holding duration and distributes the commission to
   * other entries' `escrow` (entries with `tvl > 0`), proportionally to their `tvl`.
   * - Transfers (amount - commission) to the user from the contract balance.
   * - Recomputes APR for all affected entries.
   * - Returns the amount paid out to the user.
   */
  sell_shares: ({user, id, amount}: {user: string, id: string, amount: i128}, options?: {
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
   * Construct and simulate a merge_entries transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Merge one entry into another. Admin-only.
   * 
   * Behavior:
   * - Sums `tvl` and `escrow` from `from_id` into `to_id`.
   * - Merges `shares` and `withdrawn_earnings` maps by summing per-user values.
   * - Recomputes APR for the destination entry.
   * - Deletes the source entry and updates the global index accordingly.
   */
  merge_entries: ({from_id, to_id}: {from_id: string, to_id: string}, options?: {
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
   * Construct and simulate a clean_empty_entries transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove legacy entries that have both tvl = 0 and escrow = 0.
   * Admin-only. Cleans `Index` and `EligibleIndex` accordingly.
   */
  clean_empty_entries: (options?: {
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
   * Construct and simulate a clean_empty_entries_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Batched variant: remove up to `limit` legacy entries with tvl=0 and escrow=0.
   * Returns the number of entries removed in this batch.
   */
  clean_empty_entries_batch: ({limit}: {limit: u32}, options?: {
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
   * Construct and simulate a clean_empty_entries_page transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Paged cleanup: scans only the [start, start+limit) window of Index, removing
   * entries with tvl=0 and escrow=0 inside that window. Rebuilds Index while only
   * decoding entries in the specified window to avoid heavy host map unpacking.
   */
  clean_empty_entries_page: ({start, limit}: {start: u32, limit: u32}, options?: {
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
   * Construct and simulate a remove_entries transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: remove specific entries by id without decoding their contents.
   * Returns count removed. Safe to use after off-chain verification.
   */
  remove_entries: ({ids}: {ids: Array<string>}, options?: {
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
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
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
      new ContractSpec([ "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUluZGV4AAAAAAAAAQAAAAAAAAAHRW50cmllcwAAAAABAAAAEAAAAAAAAAAAAAAAB05ldHdvcmsAAAAAAAAAAAAAAAAFQWRtaW4AAAA=",
        "AAAAAQAAAAAAAAAAAAAABUVudHJ5AAAAAAAABwAAAAAAAAADYXByAAAAAAsAAAAAAAAABmVzY3JvdwAAAAAACwAAAAAAAAACaWQAAAAAABAAAAAAAAAAC3NoYXJlX3NpbmNlAAAAA+wAAAATAAAACwAAAAAAAAAGc2hhcmVzAAAAAAPsAAAAEwAAAAsAAAAAAAAAA3R2bAAAAAALAAAAAAAAABJ3aXRoZHJhd25fZWFybmluZ3MAAAAAA+wAAAATAAAACw==",
        "AAAAAAAAAGVTdG9yZXMgb3IgcmVwbGFjZXMgYW4gYEVudHJ5YCBieSBpZCBhbmQgYXBwZW5kcyB0aGUgaWQgdG8gdGhlIGdsb2JhbAppbmRleC4gT25seSBjYWxsYWJsZSBieSBgQWRtaW5gLgAAAAAAAAlzZXRfZW50cnkAAAAAAAABAAAAAAAAAAVlbnRyeQAAAAAAB9AAAAAFRW50cnkAAAAAAAAA",
        "AAAAAAAAAHRSZW1vdmVzIGFuIGBFbnRyeWAgYnkgaWQgYW5kIHVwZGF0ZXMgdGhlIGdsb2JhbCBpbmRleC4gT25seSBjYWxsYWJsZQpieSBgQWRtaW5gLiBQYW5pY3MgaWYgdGhlIGVudHJ5IGRvZXMgbm90IGV4aXN0LgAAAAxyZW1vdmVfZW50cnkAAAABAAAAAAAAAAJpZAAAAAAAEAAAAAA=",
        "AAAAAAAAAD1SZXR1cm5zIGFuIGBFbnRyeWAgYnkgaWQuIFBhbmljcyBpZiB0aGUgZW50cnkgZG9lcyBub3QgZXhpc3QuAAAAAAAACWdldF9lbnRyeQAAAAAAAAEAAAAAAAAAAmlkAAAAAAAQAAAAAQAAB9AAAAAFRW50cnkAAAA=",
        "AAAAAAAAAEdCdW1wcyB3aGVuIGNvbnRyYWN0IGxvZ2ljIGNoYW5nZXMgaW4gYSB3YXkgdGhhdCBjbGllbnRzIG1heSBjYXJlIGFib3V0LgAAAAAHdmVyc2lvbgAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAATFPbmUtdGltZSBpbml0aWFsaXphdGlvbiBvZiBhZG1pbiwgbmV0d29yaywgYW5kIG9wdGlvbmFsIGVudHJ5IGlkcy4KCi0gYGFkbWluYDogQWRkcmVzcyB3aXRoIHByaXZpbGVnZWQgcmlnaHRzIChzZXQvcmVtb3ZlL3VwZ3JhZGUpLgotIGBuZXR3b3JrYDogTXVzdCBiZSAicHVibGljIiBvciAidGVzdG5ldCIuCi0gYGlkc2A6IE9wdGlvbmFsIHNlZWQgbGlzdCBvZiBlbnRyeSBpZHMgdG8gY3JlYXRlIHdpdGggemVyb2VkIHZhbHVlcy4KClBhbmljcyBpZiBjYWxsZWQgbW9yZSB0aGFuIG9uY2Ugb3IgaWYgbmV0d29yayBpcyBpbnZhbGlkLgAAAAAAAARpbml0AAAAAwAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAAduZXR3b3JrAAAAABAAAAAAAAAAA2lkcwAAAAPqAAAAEAAAAAA=",
        "AAAAAAAAADVVcGdyYWRlcyB0aGUgY29udHJhY3QgY29kZS4gT25seSBjYWxsYWJsZSBieSBgQWRtaW5gLgAAAAAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAVVJbnZlc3QgdG9rZW5zIGludG8gYW4gZW50cnkuCgpCZWhhdmlvcjoKLSBUcmFuc2ZlcnMgYGFtb3VudGAgZnJvbSBgdXNlcmAgdG8gdGhlIGNvbnRyYWN0LgotIEFsd2F5cyBpbmNyZWFzZXMgYGVzY3Jvd2AgYnkgYGFtb3VudGAuCi0gSWYgYGFtb3VudGAgPiBgZG93bmxvYWRfYW1vdW50YCB0aHJlc2hvbGQsIGluY3JlYXNlcyB1c2VyIGVxdWl0eQpzaGFyZXMgYW5kIGB0dmxgIGJ5IGBhbW91bnRgLgotIFJlY29tcHV0ZXMgQVBSLgotIExhemlseSBjcmVhdGVzIHRoZSBlbnRyeSBpZiBpdCBkb2VzIG5vdCBleGlzdCwgYW5kIGVuc3VyZXMgaXTigJlzCmxpc3RlZCBpbiB0aGUgZ2xvYmFsIGluZGV4LgAAAAAAAAZpbnZlc3QAAAAAAAMAAAAAAAAABHVzZXIAAAATAAAAAAAAAAJpZAAAAAAAEAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAUhDbGFpbSB0aGUgY2FsbGVyJ3MgcHJvcG9ydGlvbmFsIGVhcm5pbmdzIGZvciBhbiBlbnRyeS4KCkVhcm5pbmdzIGFyZSBkZWZpbmVkIGFzIGBlc2Nyb3cgLSB0dmxgIHdoZW4gcG9zaXRpdmUuIFRoZSB1c2VyJ3MKcHJvcG9ydGlvbmFsIHNoYXJlIGlzIGAodXNlcl9zaGFyZXMgLyB0dmwpICogdG90YWxfZWFybmluZ3NgLCBhZGp1c3RlZApieSBwcmV2aW91c2x5IHdpdGhkcmF3biBhbW91bnRzLiBUcmFuc2ZlcnMgdGhlIGNsYWltYWJsZSBhbW91bnQgdG8gdGhlCnVzZXIgYW5kIHBlcnNpc3RzIHVwZGF0ZWQgYWNjb3VudGluZy4gUmV0dXJucyB0aGUgY2xhaW1lZCBhbW91bnQuAAAADmNsYWltX2Vhcm5pbmdzAAAAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAACaWQAAAAAABAAAAABAAAACw==",
        "AAAAAAAAAh9TZWxsIGEgcG9ydGlvbiBvZiB0aGUgY2FsbGVyJ3MgZXF1aXR5IHNoYXJlcyBmb3IgYW4gZW50cnkuCgpCZWhhdmlvcjoKLSBSZXF1aXJlcyB0aGUgY2FsbGVyIHRvIGhhdmUgYXQgbGVhc3QgYGFtb3VudGAgc2hhcmVzLgotIERlY3JlYXNlcyB1c2VyJ3Mgc2hhcmVzIGFuZCBlbnRyeSBgdHZsYCBieSBgYW1vdW50YC4KLSBEb2VzIE5PVCBjaGFuZ2UgdGhpcyBlbnRyeSdzIGBlc2Nyb3dgLgotIENvbXB1dGVzIGNvbW1pc3Npb24gYmFzZWQgb24gaG9sZGluZyBkdXJhdGlvbiBhbmQgZGlzdHJpYnV0ZXMgdGhlIGNvbW1pc3Npb24gdG8Kb3RoZXIgZW50cmllcycgYGVzY3Jvd2AgKGVudHJpZXMgd2l0aCBgdHZsID4gMGApLCBwcm9wb3J0aW9uYWxseSB0byB0aGVpciBgdHZsYC4KLSBUcmFuc2ZlcnMgKGFtb3VudCAtIGNvbW1pc3Npb24pIHRvIHRoZSB1c2VyIGZyb20gdGhlIGNvbnRyYWN0IGJhbGFuY2UuCi0gUmVjb21wdXRlcyBBUFIgZm9yIGFsbCBhZmZlY3RlZCBlbnRyaWVzLgotIFJldHVybnMgdGhlIGFtb3VudCBwYWlkIG91dCB0byB0aGUgdXNlci4AAAAAC3NlbGxfc2hhcmVzAAAAAAMAAAAAAAAABHVzZXIAAAATAAAAAAAAAAJpZAAAAAAAEAAAAAAAAAAGYW1vdW50AAAAAAALAAAAAQAAAAs=",
        "AAAAAAAAAShNZXJnZSBvbmUgZW50cnkgaW50byBhbm90aGVyLiBBZG1pbi1vbmx5LgoKQmVoYXZpb3I6Ci0gU3VtcyBgdHZsYCBhbmQgYGVzY3Jvd2AgZnJvbSBgZnJvbV9pZGAgaW50byBgdG9faWRgLgotIE1lcmdlcyBgc2hhcmVzYCBhbmQgYHdpdGhkcmF3bl9lYXJuaW5nc2AgbWFwcyBieSBzdW1taW5nIHBlci11c2VyIHZhbHVlcy4KLSBSZWNvbXB1dGVzIEFQUiBmb3IgdGhlIGRlc3RpbmF0aW9uIGVudHJ5LgotIERlbGV0ZXMgdGhlIHNvdXJjZSBlbnRyeSBhbmQgdXBkYXRlcyB0aGUgZ2xvYmFsIGluZGV4IGFjY29yZGluZ2x5LgAAAA1tZXJnZV9lbnRyaWVzAAAAAAAAAgAAAAAAAAAHZnJvbV9pZAAAAAAQAAAAAAAAAAV0b19pZAAAAAAAABAAAAAA",
        "AAAAAAAAAHhSZW1vdmUgbGVnYWN5IGVudHJpZXMgdGhhdCBoYXZlIGJvdGggdHZsID0gMCBhbmQgZXNjcm93ID0gMC4KQWRtaW4tb25seS4gQ2xlYW5zIGBJbmRleGAgYW5kIGBFbGlnaWJsZUluZGV4YCBhY2NvcmRpbmdseS4AAAATY2xlYW5fZW1wdHlfZW50cmllcwAAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAIJCYXRjaGVkIHZhcmlhbnQ6IHJlbW92ZSB1cCB0byBgbGltaXRgIGxlZ2FjeSBlbnRyaWVzIHdpdGggdHZsPTAgYW5kIGVzY3Jvdz0wLgpSZXR1cm5zIHRoZSBudW1iZXIgb2YgZW50cmllcyByZW1vdmVkIGluIHRoaXMgYmF0Y2guAAAAAAAZY2xlYW5fZW1wdHlfZW50cmllc19iYXRjaAAAAAAAAAEAAAAAAAAABWxpbWl0AAAAAAAABAAAAAEAAAAE",
        "AAAAAAAAAOZQYWdlZCBjbGVhbnVwOiBzY2FucyBvbmx5IHRoZSBbc3RhcnQsIHN0YXJ0K2xpbWl0KSB3aW5kb3cgb2YgSW5kZXgsIHJlbW92aW5nCmVudHJpZXMgd2l0aCB0dmw9MCBhbmQgZXNjcm93PTAgaW5zaWRlIHRoYXQgd2luZG93LiBSZWJ1aWxkcyBJbmRleCB3aGlsZSBvbmx5CmRlY29kaW5nIGVudHJpZXMgaW4gdGhlIHNwZWNpZmllZCB3aW5kb3cgdG8gYXZvaWQgaGVhdnkgaG9zdCBtYXAgdW5wYWNraW5nLgAAAAAAGGNsZWFuX2VtcHR5X2VudHJpZXNfcGFnZQAAAAIAAAAAAAAABXN0YXJ0AAAAAAAABAAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAAAQ=",
        "AAAAAAAAAItBZG1pbi1vbmx5OiByZW1vdmUgc3BlY2lmaWMgZW50cmllcyBieSBpZCB3aXRob3V0IGRlY29kaW5nIHRoZWlyIGNvbnRlbnRzLgpSZXR1cm5zIGNvdW50IHJlbW92ZWQuIFNhZmUgdG8gdXNlIGFmdGVyIG9mZi1jaGFpbiB2ZXJpZmljYXRpb24uAAAAAA5yZW1vdmVfZW50cmllcwAAAAAAAQAAAAAAAAADaWRzAAAAA+oAAAAQAAAAAQAAAAQ=" ]),
      options
    )
  }
  public readonly fromJSON = {
    set_entry: this.txFromJSON<null>,
        remove_entry: this.txFromJSON<null>,
        get_entry: this.txFromJSON<Entry>,
        version: this.txFromJSON<u32>,
        init: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>,
        invest: this.txFromJSON<null>,
        claim_earnings: this.txFromJSON<i128>,
        sell_shares: this.txFromJSON<i128>,
        merge_entries: this.txFromJSON<null>,
        clean_empty_entries: this.txFromJSON<u32>,
        clean_empty_entries_batch: this.txFromJSON<u32>,
        clean_empty_entries_page: this.txFromJSON<u32>,
        remove_entries: this.txFromJSON<u32>
  }
}