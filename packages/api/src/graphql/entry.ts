import { GraphQLError } from 'graphql';
import { AlgoliaClient } from '../algolia/algolia';
import { Context } from '../util/types';

export const entryByIdResolver = async (_: any, { id }: any, { env }: Context) => {
	const algolia = new AlgoliaClient(env);

	try {
		return await algolia.getEntry(id);
	} catch (ex) {
		throw new GraphQLError('Entry with given id does not exist');
	}
};
