import { AlgoliaClient } from 'src/algolia/algolia';
import { requireAuth } from 'src/auth/auth-context';
import { Context } from 'src/util/types';
const adminId = '-LbM3m6WKdVQAsY3zrAd';

export const removeEntryResolver = async (_: any, { id }: any, ctx: Context) => {
	const user = requireAuth(ctx);
	const algolia = new AlgoliaClient(ctx.env);

	if (user.id === adminId) {
		return algolia.deleteEntry(id);
	}

	// give permision if user is owner

	return false;
};
