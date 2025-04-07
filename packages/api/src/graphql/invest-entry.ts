import Mailer from '../sendgrid/sendgrid';
import { Context } from '../util/types';
import { requireAuth } from '../auth/auth-context';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';
import { AlgoliaClient } from 'src/algolia/algolia';

// TODO: Implement the investEntryResolver with Soroban
export const investEntryResolver = async (_: any, args: any, context: Context) => {
	const { id, amount } = args;
	const { env } = context;
	const user = requireAuth(context);
	const encryption = new Encryption(env);
	const mailer = new Mailer(env);
	const algolia = new AlgoliaClient(env);
	const contract = new ContractClient(env);
	console.log('invest resolver');

	// call invest function from contract
	const res = await contract.invest(await encryption.decrypt(user.seed), id, amount);
	console.log('after invest contract');

	// get data from soroban

	const sorobanEntry = await contract.getEntry(id);

	console.log('soroban entry', sorobanEntry);

	try {
		// update fields in algolia entry
		await algolia.partialUpdateEntry({
			tvl: sorobanEntry.tvl,
			apr: sorobanEntry.apr,
			escrow: sorobanEntry.escrow,
			objectID: id,
		});

		const shares = (sorobanEntry.shares as any).find((share: any) => share[0] === user?.publicKey)[1];

		await algolia.updateShares(id, user.id, Number(shares));
	} catch (e) {
		console.log(e);
	}

	console.log('partial update finished');

	try {
		if (amount > 3000000) {
			await mailer.sendNftInvestEmail(user.email);
		}
	} catch (e) {
		console.log(e);
	}

	return { xdr: '', success: res?.status === 'SUCCESS', submitted: true };
};
