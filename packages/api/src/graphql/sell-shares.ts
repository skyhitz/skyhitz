import Mailer from '../postmark/mailer';
import { Context } from '../util/types';
import { requireAuth } from '../auth/auth-context';
import ContractClient from '../../contract';
import Encryption from 'src/util/encryption';
import { AlgoliaClient } from 'src/algolia/algolia';

export const sellSharesResolver = async (_: any, args: any, context: Context) => {
	const { id, amount } = args;
	const { env } = context;
	const user = requireAuth(context);
	const encryption = new Encryption(env);
	const mailer = new Mailer(env);
	const algolia = new AlgoliaClient(env);
	const contract = new ContractClient(env);

	try {
		await contract.sellShares(await encryption.decrypt(user.seed), id, amount);

		// Update on-chain state in Algolia for the sold entry
		try {
			const sorobanEntry = await contract.getEntry(id);
			await algolia.partialUpdateEntry({
				objectID: id,
				tvl: sorobanEntry.tvl,
				apr: sorobanEntry.apr,
				escrow: sorobanEntry.escrow,
			});
			const shares = (sorobanEntry.shares as any).find((share: any) => share[0] === user?.publicKey)?.[1] ?? 0;
			await algolia.updateShares(id, user.id, Number(shares));
		} catch (e) {
			console.log('sell-shares: update sold entry failed', e);
		}

		// Since commission was distributed, refresh APR/escrow for all entries
		try {
			const all = await algolia.getAllEntries();
			for (const entry of all) {
				try {
					const onchain = await contract.getEntry(entry.objectID);
					await algolia.partialUpdateEntry({
						objectID: entry.objectID,
						apr: onchain.apr,
						escrow: onchain.escrow,
					});
				} catch (_) {}
			}
		} catch (e) {
			console.log('sell-shares: refresh all APR/escrow failed', e);
		}

		return true;
	} catch (e) {
		console.log('sell-shares: contract call failed', e);
		return false;
	}
};
