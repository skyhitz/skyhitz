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

	public setEntry = async (entry: Entry) => {
		const tx = await this.contract.set_entry({ entry }, this.defaultOptions);
		const res = await tx.signAndSend();
		console.log(res.getTransactionResponse);
		console.log(res.result);
		return res;
	};

	public removeEntry = async (id: string) => {
		const tx = await this.contract.remove_entry({ id }, this.defaultOptions);
		const res = await tx.signAndSend();
		console.log(res);
		return res;
	};

	public getEntry = async (id: string) => {
		const tx = await this.contract.get_entry({ id }, this.defaultOptions);
		console.log(tx);
		console.log(tx.simulationData);
		return { ...tx.result, apr: Number(tx.result.apr), escrow: Number(tx.result.escrow), tvl: Number(tx.result.tvl) };
	};

	public claimEarnings = async (userPublicKey: string, id: string, secret?: string) => {
		// If no secret is provided, we can't claim on behalf of the user
		if (!secret) {
			throw new Error('User secret key required to claim earnings');
		}

		const userKeys = Keypair.fromSecret(secret);
		// Make sure the public key matches the one derived from the secret
		if (userKeys.publicKey() !== userPublicKey) {
			throw new Error('Provided public key does not match the secret key');
		}

		const tx = await this.contract.claim_earnings(
			{
				user: userPublicKey,
				id,
			},
			this.defaultOptions
		);

		const jsonFromRoot = tx.toJSON();
		const userClient = this.getClientForKeypair(userKeys);
		const txUser = userClient.fromJSON['claim_earnings'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txUser.signAuthEntries({ expiration: ledger });
		const jsonFromUser = txUser.toJSON();
		const txRoot = this.contract.fromJSON['claim_earnings'](jsonFromUser);

		try {
			const result = await txRoot.signAndSend();
			console.log('Claim earnings result:', result);

			// Extract the claimed amount directly from the return value
			const claimedAmount = Number(result.result);
			return {
				...result,
				claimedAmount: claimedAmount || 0,
			};
		} catch (error) {
			console.error('Error claiming earnings:', error);
			return {
				claimedAmount: 0,
				error,
			};
		}
	};

	public init = async (ids: string[]) => {
		console.log('init', ids);
		const tx = await this.contract.init({ admin: this.sourceKeys.publicKey(), network: this.network, ids: ids }, this.defaultOptions);
		console.log(tx);
		const res = await tx.signAndSend();
		console.log(res);
		return res;
	};

	public invest = async (secret: string, id: string, amount: number) => {
		const userKeys = Keypair.fromSecret(secret);
		const tx = await this.contract.invest(
			{
				user: userKeys.publicKey(),
				id,
				amount: BigInt(amount),
			},
			this.defaultOptions
		);

		const jsonFromRoot = tx.toJSON();
		const userClient = this.getClientForKeypair(userKeys);
		const txUser = userClient.fromJSON['invest'](jsonFromRoot);
		const ledger = (await this.fetchCurrentLedger()) + 100;
		await txUser.signAuthEntries({ expiration: ledger });
		const jsonFromUser = txUser.toJSON();
		const txRoot = this.contract.fromJSON['invest'](jsonFromUser);
		const result = await txRoot.signAndSend();
		const getRes = result.getTransactionResponse as any;
		console.log(getRes.resultXdr.toXDR('base64'));
		xdr.TransactionMeta.fromXDR(getRes.resultMetaXdr.toXDR('base64'), 'base64')
			.v3()
			.sorobanMeta()
			?.diagnosticEvents()
			.forEach((event: any) => {
				console.log(scValToNative(event.event().body().v0().data()));
			});
		return result.getTransactionResponse;
	};
}

export default ContractClient;
