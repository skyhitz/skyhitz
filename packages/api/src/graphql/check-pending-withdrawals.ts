import { AlgoliaClient } from 'src/algolia/algolia';
import { Context } from 'src/util/types';
import KrakenClient from 'src/kraken/client';

export async function checkPendingWithdrawalsResolver(_: any, __: any, context: Context) {
	const algolia = new AlgoliaClient(context.env);
	const krakenClient = new KrakenClient(context.env);

	const pendingWithdrawals = await algolia.getPendingWithdrawals();

	const statusData = await krakenClient.withdrawStatus();

	if (statusData.error?.length > 0) {
		throw new Error('Kraken API error:' + JSON.stringify(statusData.error));
	}

	for (const withdrawal of pendingWithdrawals) {
		const withdrawalStatus = statusData.result.find((w) => w.refid === withdrawal.objectID);

		if (withdrawalStatus?.status === 'Success') {
			// Update withdrawal status
			await algolia.updateWithdrawalStatus(withdrawal.objectID, 'complete');
			// Remove minBalance flag
			const user = await algolia.getUserByEmail(withdrawal.email);
			if (!user) {
				console.error(`User not found for email: ${withdrawal.email}`);
				continue;
			}
			await algolia.updateUserMinBalance(user.id, 0);
			console.log(`Reset minBalance for user ${user.objectID}`);

			// delete withdraw object now that we have completed the transaction
			await algolia.deleteWithdrawal(withdrawal.objectID);
			console.log(`Deleted withdrawal ${withdrawal.objectID}`);
		}
	}

	return true;
}
