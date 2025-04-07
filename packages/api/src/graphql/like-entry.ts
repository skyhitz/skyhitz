import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from '../algolia/algolia';
import { Context } from 'src/util/types';

export const likeEntryResolver = async (_: any, { id, like }: any, ctx: Context) => {
	const user = requireAuth(ctx);
	const algolia = new AlgoliaClient(ctx.env);
	if (like) {
		return await algolia.likeMulti(user.id, id);
	}
	return await algolia.unlikeMulti(user.id, id);
};
