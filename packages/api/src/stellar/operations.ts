import axios from 'axios';
import { Keypair, Asset, TransactionBuilder, Operation, Account, Networks, Transaction, StrKey, xdr } from '@stellar/stellar-sdk';

const XLM = Asset.native();

class StellarClient {
	private env: Env;
	private sourceKeys: Keypair;
	private NETWORK_PASSPHRASE;
	private horizonUrl: 'https://horizon-testnet.stellar.org' | 'https://horizon.stellar.org';
	private transactionFee = '0.06';

	constructor(env: Env) {
		this.env = env;
		this.sourceKeys = Keypair.fromSecret(env.ISSUER_SEED);
		this.horizonUrl = env.STELLAR_NETWORK === 'testnet' ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';
		this.NETWORK_PASSPHRASE = env.STELLAR_NETWORK === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
	}

	async getAccountData(publicKey: string) {
		const account = await axios.get(`${this.horizonUrl}/accounts/${publicKey}`).then(({ data }) => data);
		return account;
	}

	async accountCredits(publicAddress: string) {
		const { balances, subentry_count, num_sponsoring, num_sponsored }: any = await this.getAccountData(publicAddress);

		const [currentBalance] = balances.filter((balance: any) => balance.asset_type === 'native');
		if (currentBalance && currentBalance.balance) {
			const floatBalance = parseFloat(currentBalance.balance);
			const minBalance = (2 + subentry_count + num_sponsoring - num_sponsored) * 0.5;

			const availableCredits = floatBalance - minBalance;
			return { credits: floatBalance, availableCredits };
		}
		return { credits: 0, availableCredits: 0 };
	}

	async loadSkyhitzAssets(sourcePublicKey: string): Promise<string[]> {
		let { balances } = await this.getAccountData(sourcePublicKey);
		const assetCodes = balances
			.filter((balance: any) => {
				if (balance.asset_type !== 'native') {
					return true;
				}
				return false;
			})
			.map((ba: any) => ba.asset_code);
		return assetCodes;
	}

	async getXlmInUsdDexPrice() {
		let response = await axios
			.get(
				`https://horizon.stellar.org/order_book?selling_asset_type=native&buying_asset_type=credit_alphanum4&buying_asset_code=USDC&buying_asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`
			)
			.then(({ data }) => data);
		return response.bids[0];
	}

	async createAndFundAccount() {
		let pair = Keypair.random();
		let secret = pair.secret();
		let publicAddress = pair.publicKey();
		try {
			await this.fundAccount(pair);
		} catch (e: any) {
			if (e && e.response) {
				console.log(e.response);
			}
			throw e;
		}
		return {
			secret,
			publicAddress,
		};
	}

	async buildTransactionWithFee(accountPublicKey: string) {
		const [account, fee] = await Promise.all([this.getAccount(accountPublicKey), this.getFee()]);
		return new TransactionBuilder(account, {
			fee: fee,
			networkPassphrase: this.NETWORK_PASSPHRASE,
		});
	}

	async fundAccount(destinationKeys: Keypair) {
		if (!destinationKeys.publicKey()) {
			throw 'Account does not exist';
		}

		let transaction = (await this.buildTransactionWithFee(this.sourceKeys.publicKey()))
			.addOperation(
				Operation.beginSponsoringFutureReserves({
					sponsoredId: destinationKeys.publicKey(),
				})
			)
			.addOperation(
				Operation.createAccount({
					destination: destinationKeys.publicKey(),
					startingBalance: '0',
				})
			)
			.addOperation(
				Operation.endSponsoringFutureReserves({
					source: destinationKeys.publicKey(),
				})
			)
			.setTimeout(0)
			.build();
		transaction.sign(this.sourceKeys, destinationKeys);
		return this.submitTransaction(transaction);
	}

	async submitTransaction(transaction: Transaction, horizonUrl: string = this.horizonUrl) {
		const xdr = transaction.toXDR();
		console.log('submitted xdr: ', xdr);

		return axios
			.post(`${horizonUrl}/transactions?tx=${encodeURIComponent(xdr)}`)
			.then(({ data }) => data)
			.catch((error) => {
				const { data } = error.response;
				const { extras } = data;
				console.log(extras);
				throw extras;
			});
	}

	async getFee(horizonUrl: string = this.horizonUrl): Promise<string> {
		return axios
			.get(horizonUrl + `/fee_stats`)
			.then(({ data }) => data)
			.then((feeStats) => feeStats.max_fee.mode)
			.catch(() => '10000');
	}

	async getAccount(publicKey: string) {
		const { id, sequence } = await this.getAccountData(publicKey);
		return new Account(id, sequence);
	}

	verifySourceSignatureOnXDR(xdr: string) {
		const txFromXDR = new Transaction(xdr, this.NETWORK_PASSPHRASE);
		const hashedSignatureBase = txFromXDR.hash();
		const [signature] = txFromXDR.signatures;
		const keypair = Keypair.fromPublicKey(txFromXDR.source);
		return {
			verified: keypair.verify(hashedSignatureBase, signature.signature()),
			source: txFromXDR.source,
		};
	}

	async withdrawToExternalAddress(address: string, amount: number, seed: string) {
		const keys = Keypair.fromSecret(seed);
		const accountPublicKey = keys.publicKey();

		const transactionFee = amount * parseFloat(this.transactionFee);

		const transaction = (await this.buildTransactionWithFee(accountPublicKey))
			.addOperation(
				Operation.payment({
					destination: this.sourceKeys.publicKey(),
					asset: XLM,
					amount: transactionFee.toFixed(6).toString(),
				})
			)
			.addOperation(
				Operation.payment({
					destination: address,
					asset: XLM,
					amount: (amount - transactionFee).toFixed(6).toString(),
				})
			)
			.setTimeout(0)
			.build();

		transaction.sign(keys);
		const transactionResult = await this.submitTransaction(transaction);
		console.log('\nSuccess! View the transaction at: ', transactionResult);
		return transactionResult;
	}

	async pay(address: string, amount: number) {
		const keys = this.sourceKeys;
		const accountPublicKey = keys.publicKey();

		const transaction = (await this.buildTransactionWithFee(accountPublicKey))
			.addOperation(
				Operation.payment({
					destination: address,
					asset: XLM,
					amount: amount.toFixed(6).toString(), // Amount in lumens
				})
			)
			.setTimeout(0)
			.build();

		transaction.sign(keys);
		const transactionResult = await this.submitTransaction(transaction);
		console.log('\nSuccess! View the transaction at: ', transactionResult);
		return transactionResult;
	}
}

export default StellarClient;
