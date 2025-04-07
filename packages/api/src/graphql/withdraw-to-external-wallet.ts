import Encryption from '../util/encryption';
import StellarClient from '../stellar/operations';
import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';

/**
 * Withdraws user balance to external address in XLM
 */
export const withdrawToExternalAddressResolver = async (_: any, { address, amount }: any, ctx: any) => {
	const user = requireAuth(ctx);
	const encryption = new Encryption(ctx.env);
	const stellar = new StellarClient(ctx.env);
	const algolia = new AlgoliaClient(ctx.env);

	const { seed, publicKey } = user;

	if (!seed) {
		throw new GraphQLError('Withdraw is only available for custodial accounts');
	}

	try {
		const { availableCredits: currentBalance } = await stellar.accountCredits(publicKey);

		// Get latest user data to check minBalance
		const latestUser = await algolia.getUserByPublicKey(user.publicKey);
		const minBalance = latestUser.minBalance || 0;

		// Calculate available balance for withdrawal
		const availableForWithdrawal = currentBalance - minBalance;

		if (amount > availableForWithdrawal) {
			throw new GraphQLError(
				`Cannot withdraw ${amount} XLM. Maximum withdrawal amount is ${availableForWithdrawal} XLM to maintain minimum balance of ${minBalance} XLM.`
			);
		}
		console.log(`withdrawal to address ${address}, amount ${amount.toFixed(6)}`);
		const decryptedSeed = await encryption.decrypt(seed);

		await stellar.withdrawToExternalAddress(address, amount, decryptedSeed);
		return true;
	} catch (e) {
		console.log(`error`, e);
		if (typeof e === 'string') {
			throw new GraphQLError(e);
		}
		throw new GraphQLError('Unexpected error during withdrawal.');
	}
};
