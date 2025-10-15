import { Horizon, Keypair, Transaction, hash, scValToNative, xdr, Asset, TransactionBuilder, Operation, BASE_FEE } from '@stellar/stellar-sdk';
import { Client, Entry } from './client';

Horizon.AxiosClient.defaults.adapter = 'fetch' as any;

// serialize big int
(BigInt.prototype as any).toJSON = function () {
	const int = Number.parseInt(this.toString());
	return int ?? this.toString();
};

const mainnetNetworkPassphrase = 'Public Global Stellar Network ; September 2015';
const testnetNetworkPassphrase = 'Test SDF Network ; September 2015';
const mainnetHorizonUrl = 'https://horizon.stellar.org';
const testnetHorizonUrl = 'https://horizon-testnet.stellar.org';
const mainnetContractId = 'CDCN2D4OF5IHPAHUIF6RPVH654KW6LKTYKYK3IQULBBWURD7L4CDNSRO';
const testnetContractId = 'CAEBQYLKDHUDX4B5ELJ2T32NSWYO45PA7ZO3ITPAVVYVJN6UCDG5IOLS';
const mainnetRpcUrl = 'https://soroban-rpc.mainnet.stellar.gateway.fm';
const testnetRpcUrl = 'https://soroban-testnet.stellar.org';

type HorizonUrl = typeof testnetHorizonUrl | typeof mainnetHorizonUrl;
type Network = 'testnet' | 'mainnet';
type RpcUrl = typeof testnetRpcUrl | typeof mainnetRpcUrl;
type ContractId = typeof testnetContractId | typeof mainnetContractId;
type NetworkPassphrase = typeof testnetNetworkPassphrase | typeof mainnetNetworkPassphrase;

class ContractClient {
    private sourceKeys: Keypair;
	private defaultOptions = { timeoutInSeconds: 60, fee: 100000000, restore: true };
	private network: Network;
	private horizonUrl: HorizonUrl;
	private rpcUrl: RpcUrl;
	private contractId: ContractId;
	private networkPassphrase: NetworkPassphrase;
	private contract: Client;

    constructor(env: Env) {
        this.sourceKeys = Keypair.fromSecret(env.ISSUER_SEED);
        this.network = env.STELLAR_NETWORK as Network;
        this.horizonUrl = env.STELLAR_NETWORK === 'testnet' ? testnetHorizonUrl : mainnetHorizonUrl;
        this.rpcUrl = env.STELLAR_NETWORK === 'testnet' ? testnetRpcUrl : mainnetRpcUrl;
        this.contractId = env.STELLAR_NETWORK === 'testnet' ? testnetContractId : mainnetContractId;
        this.networkPassphrase = env.STELLAR_NETWORK === 'testnet' ? testnetNetworkPassphrase : mainnetNetworkPassphrase;
        this.contract = this.getClientForKeypair(this.sourceKeys);
    }

	public getClientForKeypair(keys: Keypair) {
		return new Client({
			contractId: this.contractId,
			networkPassphrase: this.networkPassphrase,
			rpcUrl: this.rpcUrl,
			publicKey: keys.publicKey(),
			signTransaction: async (tx: string, opts) => {
				const txFromXDR = new Transaction(tx, this.networkPassphrase);
				txFromXDR.sign(keys);
				return {
					signedTxXdr: txFromXDR.toXDR(),
					signerAddress: keys.publicKey(),
				};
			},
			signAuthEntry: async (entryXdr, opts) => {
				const signedAuthEntry = keys.sign(hash(Buffer.from(entryXdr, 'base64'))).toString('base64');
				return {
					signedAuthEntry,
					signerAddress: keys.publicKey(),
				};
			},
		});
	}

    /**
     * Read HITZ token symbol from the token contract
     */
    public getHitzSymbol = async () => {
        return 'HITZ';
    };

	public async fetchCurrentLedger() {
		try {
			const response = await fetch(this.horizonUrl);
			const data: any = await response.json();
			return data.core_latest_ledger;
		} catch (error) {
			console.error('Error fetching current ledger:', error);
			return null;
		}
	}

	// Old methods removed - no longer in new contract:
	// - setEntry (entries are now created via create_entry)
	// - removeEntry (not supported in new contract)

	public getEntry = async (entry_id: string) => {
		const tx = await this.contract.get_entry({ entry_id }, this.defaultOptions);
		
		// Handle Option<Entry> return type - manually parse the raw result
		// The TypeScript bindings struggle with Option types, so we parse the XDR directly
		try {
			const simulation = tx.simulation as any;
			const rawResult = simulation?.result?.retval;
			
			if (!rawResult || rawResult._value === undefined) {
				throw new Error(`Entry ${entry_id} not found`);
			}
			
			// If it's a map (Some(Entry)), extract the values
			if (rawResult._arm === 'map' && Array.isArray(rawResult._value)) {
				const entryMap = rawResult._value;
				const getValue = (key: string) => {
					const item = entryMap.find((e: any) => {
						const keyBuffer = e._attributes?.key?._value;
						if (keyBuffer && keyBuffer.type === 'Buffer') {
							const keyStr = Buffer.from(keyBuffer.data).toString('utf-8');
							return keyStr === key;
						}
						return false;
					});
					
					if (!item) return 0;
					
					const val = item._attributes?.val;
					if (val?._arm === 'u64') {
						return Number(val._value._value);
					} else if (val?._arm === 'i128') {
						return Number(val._value._attributes.lo._value);
					}
					return 0;
				};
				
				return {
					created_at: getValue('created_at'),
					escrow_xlm: getValue('escrow_xlm'),
					tvl_xlm: getValue('tvl_xlm'),
					// For backwards compatibility
					escrow: getValue('escrow_xlm'),
					tvl: getValue('tvl_xlm'),
				};
			}
			
			// If None (void), entry doesn't exist
			throw new Error(`Entry ${entry_id} not found`);
			
		} catch (e) {
			console.error(`Error parsing entry ${entry_id}:`, (e as any)?.message);
			throw e;
		}
	};

	// Old methods removed - replaced by new contract methods:
	// - claimEarnings → use claimRewards instead
	// - sellShares → use unstake instead
	// - mergeEntries → not in new contract (admin can still merge via backend)
	// - cleanEmptyEntries → not needed in new contract
	// - cleanEmptyEntriesBatch → not needed in new contract

    /**
     * Initialize the contract (admin-only, one-time)
     * New signature: (admin, treasury, hitz_token, xlm_token, base_fee)
     */
	public init = async (
		admin: string,
		treasury: string,
		hitz_token: string,
		xlm_token: string,
		base_fee: bigint
	) => {
        console.log('init', { admin, treasury, hitz_token, xlm_token, base_fee });
		const tx = await this.contract.init(
            { admin, treasury, hitz_token, xlm_token, base_fee },
			this.defaultOptions
		);
		console.log(tx);
		const res = await tx.signAndSend();
		console.log(res);
		return res;
	};

	// Old invest method removed - use recordAction('invest', amount) instead

	public createEntry = async (entryId: string) => {
		const tx = await this.contract.create_entry({ entry_id: entryId }, this.defaultOptions);
		const res = await tx.signAndSend();
		return res;
	};

	public recordAction = async (secret: string, entryId: string, kind: 'stream' | 'like' | 'download' | 'mine' | 'invest', amountXlm?: number) => {
		const userKeys = Keypair.fromSecret(secret);
		const tx = await this.contract.record_action(
			{
				caller: userKeys.publicKey(),
				entry_id: entryId,
				kind,
				amount_xlm: amountXlm !== undefined ? BigInt(amountXlm) : undefined,
			},
			this.defaultOptions
		);

		const jsonFromRoot = tx.toJSON();
		const userClient = this.getClientForKeypair(userKeys);
		const txUser = userClient.fromJSON['record_action'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txUser.signAuthEntries({ expiration: ledger });
		const jsonFromUser = txUser.toJSON();
		const txRoot = this.contract.fromJSON['record_action'](jsonFromUser);
		const result = await txRoot.signAndSend();
		
		try {
			const getRes = result.getTransactionResponse as any;
			if (getRes?.resultXdr) {
				console.log(getRes.resultXdr.toXDR('base64'));
			}
			if (getRes?.resultMetaXdr) {
				try {
					const meta = xdr.TransactionMeta.fromXDR(getRes.resultMetaXdr.toXDR('base64'), 'base64');
					const v3 = (meta as any).v3?.call ? (meta as any).v3() : null;
					const sorobanMeta = v3?.sorobanMeta?.call ? v3.sorobanMeta() : null;
					sorobanMeta?.diagnosticEvents?.()?.forEach((event: any) => {
						console.log(scValToNative(event.event().body().v0().data()));
					});
				} catch (e) {
					console.log('recordAction: meta parse skipped', (e as any)?.message || e);
				}
			}
		} catch (e) {
			console.log('recordAction: diagnostic logging failed', (e as any)?.message || e);
		}
		return result.getTransactionResponse;
	};

	public getStake = async (entryId: string, owner: string) => {
		const tx = await this.contract.get_stake({ entry_id: entryId, owner }, this.defaultOptions);
		return Number(tx.result);
	};

	public getStakeTotal = async (entryId: string) => {
		const tx = await this.contract.get_stake_total({ entry_id: entryId }, this.defaultOptions);
		return Number(tx.result);
	};

	public getClaimableRewards = async (entryId: string, user: string) => {
		const tx = await this.contract.get_claimable_rewards({ entry_id: entryId, user }, this.defaultOptions);
		return Number(tx.result);
	};

	public claimRewards = async (secret: string, entryId: string) => {
		const userKeys = Keypair.fromSecret(secret);
		const tx = await this.contract.claim_rewards(
			{
				entry_id: entryId,
				claimer: userKeys.publicKey(),
			},
			this.defaultOptions
		);

		const jsonFromRoot = tx.toJSON();
		const userClient = this.getClientForKeypair(userKeys);
		const txUser = userClient.fromJSON['claim_rewards'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txUser.signAuthEntries({ expiration: ledger });
		const jsonFromUser = txUser.toJSON();
		const txRoot = this.contract.fromJSON['claim_rewards'](jsonFromUser);
		const result = await txRoot.signAndSend();
		
		return {
			...result,
			claimedAmount: Number(result.result) || 0,
		};
	};

	public calculateApr = async (entryId: string) => {
		const tx = await this.contract.calculate_apr({ entry_id: entryId }, this.defaultOptions);
		return Number(tx.result);
	};

	/**
	 * Get user's HITZ token balance
	 * Uses Horizon API to query SAC token balance
	 */
    public getHitzBalance = async (userPublicKey: string) => {
        try {
            const server = new Horizon.Server(this.horizonUrl);
            const account = await server.loadAccount(userPublicKey);
            
            // Find HITZ balance in account balances
            const hitzBalance = account.balances.find((balance: any) => {
                return balance.asset_code === 'HITZ' && 
                       balance.asset_issuer === this.sourceKeys.publicKey();
            });
            
            if (hitzBalance && 'balance' in hitzBalance) {
                return Number(parseFloat(hitzBalance.balance) * 10_000_000); // Convert to stroops
            }
            return 0;
        } catch (error) {
            console.error('Error fetching HITZ balance:', error);
            return 0;
        }
    };

	/**
	 * Transfer HITZ tokens to another address
	 * Uses the Stellar SDK for SAC token transfers
	 * @param secret - User's secret key
	 * @param toAddress - Destination Stellar address
	 * @param amount - Amount in HITZ (not stroops) - e.g., 2000 for 2000 HITZ
	 */
    public transferHitz = async (secret: string, toAddress: string, amount: number) => {
        try {
            const userKeys = Keypair.fromSecret(secret);
            const server = new Horizon.Server(this.horizonUrl);
            const sourceAccount = await server.loadAccount(userKeys.publicKey());
            
            // Amount is already in human-readable HITZ format (e.g., 2000 HITZ)
            // Just format it to 7 decimal places for Stellar
            const amountStr = amount.toFixed(7);
            
            // Build payment operation
            const asset = new Asset('HITZ', this.sourceKeys.publicKey());
            const transaction = new TransactionBuilder(sourceAccount, {
                fee: BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
                .addOperation(
                    Operation.payment({
                        destination: toAddress,
                        asset: asset,
                        amount: amountStr,
                    })
                )
                .setTimeout(30)
                .build();
            
            transaction.sign(userKeys);
            const result = await server.submitTransaction(transaction);
            
            return {
                success: true,
                txHash: result.hash,
            };
        } catch (error) {
            console.error('Error transferring HITZ:', error);
            throw new Error('Failed to transfer HITZ tokens');
        }
    };

	/**
	 * Distribute rewards from Treasury to all entries proportionally
	 * Requires Treasury keypair for auth entry signing
	 */
	public distributeRewards = async (treasurySecret: string, hitzAmount: bigint) => {
		const treasuryKeys = Keypair.fromSecret(treasurySecret);
		const tx = await this.contract.distribute_rewards(
			{
				caller: treasuryKeys.publicKey(),
				hitz_amount: hitzAmount,
			},
			this.defaultOptions
		);

		// Auth entry signing pattern (same as claimRewards/unstake)
		const jsonFromRoot = tx.toJSON();
		const treasuryClient = this.getClientForKeypair(treasuryKeys);
		const txTreasury = treasuryClient.fromJSON['distribute_rewards'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txTreasury.signAuthEntries({ expiration: ledger });
		const jsonFromTreasury = txTreasury.toJSON();
		const txRoot = this.contract.fromJSON['distribute_rewards'](jsonFromTreasury);
		const result = await txRoot.signAndSend();
		
		return result;
	};

	/**
	 * Get entry stats
	 * Returns: [tvl_xlm, escrow_xlm, total_staked, reward_pool, apr]
	 */
	public getEntryStats = async (entryId: string) => {
		const tx = await this.contract.get_entry_stats({ entry_id: entryId }, this.defaultOptions);
		// Result is a tuple: [tvl_xlm, escrow_xlm, total_staked, reward_pool, apr]
		const [tvl_xlm, escrow_xlm, total_staked, reward_pool, apr] = tx.result;
		return {
			tvlXlm: Number(tvl_xlm),
			escrowXlm: Number(escrow_xlm),
			totalStaked: Number(total_staked),
			rewardPool: Number(reward_pool),
			apr: Number(apr),
		};
	};

	/**
	 * Get current base fee in stroops
	 */
	public getBaseFee = async () => {
		const tx = await this.contract.get_base_fee(this.defaultOptions);
		return Number(tx.result);
	};

	public unstake = async (secret: string, entryId: string, amount: number) => {
		const userKeys = Keypair.fromSecret(secret);
		const tx = await this.contract.unstake(
			{
				entry_id: entryId,
				caller: userKeys.publicKey(),
				amount: BigInt(amount),
			},
			this.defaultOptions
		);

		const jsonFromRoot = tx.toJSON();
		const userClient = this.getClientForKeypair(userKeys);
		const txUser = userClient.fromJSON['unstake'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txUser.signAuthEntries({ expiration: ledger });
		const jsonFromUser = txUser.toJSON();
		const txRoot = this.contract.fromJSON['unstake'](jsonFromUser);
		const result = await txRoot.signAndSend();
		
		return {
			...result,
			unstakedAmount: Number(result.result) || 0,
		};
	};

	/**
	 * Get oracle data (price and last update timestamp)
	 * Returns [price_in_stroops, last_update_timestamp]
	 */
	public getOracleData = async (): Promise<readonly [bigint, bigint]> => {
		const tx = await this.contract.get_oracle_data(this.defaultOptions);
		return tx.result;
	};

	/**
	 * Get entry count
	 */
	public getEntryCount = async (): Promise<number> => {
		const tx = await this.contract.entry_count(this.defaultOptions);
		return Number(tx.result);
	};

	/**
	 * List entry IDs with pagination
	 * @param start - Starting index
	 * @param limit - Number of entries to fetch
	 */
	public listEntries = async (start: number, limit: number): Promise<string[]> => {
		const tx = await this.contract.list_entries(
			{ start: start, limit: limit },
			this.defaultOptions
		);
		return tx.result as string[];
	};

	/**
	 * Get all entry IDs (handles pagination automatically)
	 */
	public getAllEntryIds = async (): Promise<string[]> => {
		const count = await this.getEntryCount();
		const allEntryIds: string[] = [];
		const batchSize = 100; // Fetch in batches of 100
		
		for (let i = 0; i < count; i += batchSize) {
			const batch = await this.listEntries(i, Math.min(batchSize, count - i));
			allEntryIds.push(...batch);
		}
		
		return allEntryIds;
	};

	/**
	 * Update oracle price (treasury-only)
	 * This is called by the treasury bot to update market price
	 * Requires Treasury keypair for auth entry signing
	 */
	public updateOraclePrice = async (treasurySecret: string, newPriceStroops: bigint) => {
		const treasuryKeys = Keypair.fromSecret(treasurySecret);
		const tx = await this.contract.update_oracle_price(
			{
				caller: treasuryKeys.publicKey(),
				new_price: newPriceStroops,
			},
			this.defaultOptions
		);

		// Auth entry signing pattern (same as other auth-required methods)
		const jsonFromRoot = tx.toJSON();
		const treasuryClient = this.getClientForKeypair(treasuryKeys);
		const txTreasury = treasuryClient.fromJSON['update_oracle_price'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txTreasury.signAuthEntries({ expiration: ledger });
		const jsonFromTreasury = txTreasury.toJSON();
		const txRoot = this.contract.fromJSON['update_oracle_price'](jsonFromTreasury);
		const result = await txRoot.signAndSend();
		
		return result;
	};
}

export default ContractClient;
