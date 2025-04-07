import { GraphQLError } from 'graphql';
import { sign } from '@tsndr/cloudflare-worker-jwt';
import PasswordlessAuth from '../auth/passwordless';
import { Context } from '../util/types';
import { AlgoliaClient } from '../algolia/algolia';

export const signInWithTokenResolver = async (_: any, { token: graphQLToken, uid }: any, context: Context) => {
	const { env } = context;
	const passwordlessAuth = new PasswordlessAuth(env);

	const { valid } = await passwordlessAuth.authenticate(graphQLToken, uid);

	if (!valid) {
		throw new GraphQLError('Provided link is not valid');
	}

	const client = new AlgoliaClient(env);
	let user = await client.getUser(uid);
	const token = await sign(
		{
			email: user.email,
			version: user.version,
			sub: user.id,
		} as any,
		env.JWT_SECRET,
		{ algorithm: 'HS256' }
	);
	user.jwt = token;

	await passwordlessAuth.invalidateUser(uid);

	return { ...user, managed: user.seed !== '' };
};
