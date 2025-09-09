import { requireAuth } from '../auth/auth-context';
import StellarClient from '../stellar/operations';
import { Context } from '../util/types';
import ContractClient from '../../contract';

export const XLMPriceResolver = async (root: any, args: any, ctx: Context) => {
	await requireAuth(ctx);

	const stellar = new StellarClient(ctx.env);

	const { price } = await stellar.getXlmInUsdDexPrice();
	return price;
};

export const claimEarningsPreviewResolver = async (_: any, __: any, ctx: Context) => {
	const user = requireAuth(ctx);
	const contract = new ContractClient(ctx.env);
	try {
		const { AlgoliaClient } = await import('src/algolia/algolia');
		const algolia = new AlgoliaClient(ctx.env);
		const shares = await algolia.getCollection(user.id);
		let totalClaimable = 0;
		for (const s of shares) {
			const e = await contract.getEntry(s.entryId);
			if (e.tvl <= 0 || e.escrow <= e.tvl) continue;
			const totalEarnings = e.escrow - e.tvl;
			const userShares = s.shares || 0;
			if (userShares <= 0) continue;
			const userEarned = (totalEarnings * userShares) / e.tvl;
			totalClaimable += Math.max(0, userEarned);
		}
		return {
			success: true,
			message: totalClaimable > 0 ? 'Claimable earnings available' : 'No earnings yet',
			totalClaimedAmount: totalClaimable,
			claimedEntries: [],
			lastClaimTime: null,
		};
	} catch (e) {
		return {
			success: false,
			message: 'Preview failed',
			totalClaimedAmount: 0,
			claimedEntries: [],
			lastClaimTime: null,
		};
	}
};
