import { requireAuth } from '../auth/auth-context';
import StellarClient from '../stellar/operations';
import { Context } from '../util/types';

export const XLMPriceResolver = async (root: any, args: any, ctx: Context) => {
	await requireAuth(ctx);

	const stellar = new StellarClient(ctx.env);

	const { price } = await stellar.getXlmInUsdDexPrice();
	return price;
};
