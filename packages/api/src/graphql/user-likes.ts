import { AlgoliaClient } from '../algolia/algolia';
import { requireAuth } from '../auth/auth-context';
import { Context } from '../util/types';

export const userLikesResolver = async (_: any, _args: any, ctx: Context) => {
	const user = requireAuth(ctx);
	const algolia = new AlgoliaClient(ctx.env);
	const entriesArr = await algolia.getEntriesLikesWithUserId(user.id);

	return entriesArr;
};
