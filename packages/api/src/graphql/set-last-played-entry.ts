import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from '../algolia/algolia';
import { Context } from 'src/util/types';

type SetLastPlayedEntryArgs = {
	entryId: String;
};

export const setLastPlayedEntryResolver = async (_: any, { entryId }: SetLastPlayedEntryArgs, ctx: Context) => {
	const user = await requireAuth(ctx);
	const algolia = new AlgoliaClient(ctx.env);
	const entry = await algolia.getEntry(String(entryId));
	if (!entry) return { success: false, message: 'Invalid entry id' };
	const userUpdate = {
		...user,
		lastPlayedEntry: entry,
	};
	await algolia.updateUser(userUpdate);
	return true;
};
