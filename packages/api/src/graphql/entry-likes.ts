import { AlgoliaClient } from '../algolia/algolia';
import { Context } from '../util/types';

export const entryLikesResolver = async (_: any, { id }: any, { env }: Context) => {
	const algolia = new AlgoliaClient(env);
	const usersArr = await algolia.getUsersLikesWithEntryId(id);

	return {
		count: usersArr.length,
		users: usersArr.map(({ avatarUrl, displayName, username, id, description }) => {
			return {
				avatarUrl: avatarUrl,
				displayName: displayName,
				username: username,
				id: id,
				description: description,
			};
		}),
	};
};
