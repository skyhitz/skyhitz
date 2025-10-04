import { Horizon, Keypair, Transaction, hash, scValToNative, xdr } from '@stellar/stellar-sdk';
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
		console.log(tx);
		console.log(tx.simulationData);
		// Entry fields are: created_at, escrow_xlm, tvl_xlm (no apr field)
		if (!tx.result) {
			throw new Error(`Entry ${entry_id} not found`);
		}
		return {
			created_at: Number(tx.result.created_at),
			escrow_xlm: Number(tx.result.escrow_xlm),
			tvl_xlm: Number(tx.result.tvl_xlm),
			// For backwards compatibility, add these aliases
			escrow: Number(tx.result.escrow_xlm),
			tvl: Number(tx.result.tvl_xlm),
		};
	};

	// Old methods removed - replaced by new contract methods:
	// - claimEarnings → use claimRewards instead
	// - sellShares → use unstake instead
	// - mergeEntries → not in new contract (admin can still merge via backend)
	// - cleanEmptyEntries → not needed in new contract
	// - cleanEmptyEntriesBatch → not needed in new contract

	/**
	 * Initialize the contract (admin-only, one-time)
	 * New signature: (admin, treasury, hitz_token, xlm_token, stake_unit_hitz, base_fee)
	 */
	public init = async (
		admin: string,
		treasury: string,
		hitz_token: string,
		xlm_token: string,
		stake_unit_hitz: bigint,
		base_fee: bigint
	) => {
		console.log('init', { admin, treasury, hitz_token, xlm_token, stake_unit_hitz, base_fee });
		const tx = await this.contract.init(
			{ admin, treasury, hitz_token, xlm_token, stake_unit_hitz, base_fee },
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
	 * Uses the Soroban token client to query the HITZ contract
	 */
	public getHitzBalance = async (userPublicKey: string) => {
		try {
			// For now, return 0 as HITZ contract address needs to be deployed and configured
			// TODO: Once HITZ contract is deployed, use env.HITZ_TOKEN_ADDRESS
			console.log('getHitzBalance called for:', userPublicKey);
			return 0;
		} catch (error) {
			console.error('Error fetching HITZ balance:', error);
			return 0;
		}
	};

	/**
	 * Transfer HITZ tokens to another address
	 * Uses the Soroban token transfer functionality
	 */
	public transferHitz = async (secret: string, toAddress: string, amount: number) => {
		try {
			// Convert amount to stroops (HITZ uses 7 decimals like XLM)
			const amountInStroops = BigInt(Math.floor(amount * 10_000_000));

			// For now, return a placeholder response
			// TODO: Once HITZ contract is deployed, implement actual transfer logic:
			// 1. Get HITZ token address from env.HITZ_TOKEN_ADDRESS
			// 2. Create Soroban token client
			// 3. Call transfer(from, to, amount)
			// 4. Return transaction hash
			
			console.log('transferHitz called:', {
				from: Keypair.fromSecret(secret).publicKey(),
				to: toAddress,
				amount,
				stroops: amountInStroops.toString(),
			});

			// Placeholder - will be replaced with actual contract call
			return {
				success: true,
				txHash: 'placeholder_tx_hash',
			};
		} catch (error) {
			console.error('Error transferring HITZ:', error);
			throw new Error('Failed to transfer HITZ tokens');
		}
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
}

export default ContractClient;
