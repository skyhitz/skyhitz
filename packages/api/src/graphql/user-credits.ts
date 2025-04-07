import { GraphQLError } from 'graphql';
import { Context } from '../util/types';
import { requireAuth } from '../auth/auth-context';
import StellarClient from '../stellar/operations';

export const userCreditsResolver = async (_root: any, _args: any, ctx: Context) => {
	const user = requireAuth(ctx);

	try {
		const stellar = new StellarClient(ctx.env);
		const { availableCredits: credits } = await stellar.accountCredits(user.publicKey);

		return credits;
	} catch (_) {
		throw new GraphQLError('Could not fetch account credits');
	}
};
