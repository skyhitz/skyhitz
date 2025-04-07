import { decode, verify } from '@tsndr/cloudflare-worker-jwt';
import { AlgoliaClient } from '../algolia/algolia';
import { Context, User } from '../util/types';

interface UserCache {
	[key: string]: User | undefined;
}

let userCache: UserCache = {};

export const authenticateUser = async ({ env, request }: { env: Env; request: Request }) => {
	const authHeader = request.headers.get('authorization') || '';
	const token = authHeader.replace('Bearer ', '');
	if (!token) {
		return { env };
	}
	const isValid = await verify(token, env.JWT_SECRET);
	if (!isValid) {
		return { env };
	}

	const { payload } = decode(token);

	if (!payload?.sub) {
		return { env };
	}

	const client = new AlgoliaClient(env);

	let user = userCache[payload.sub];

	if (!user) {
		user = await client.getUser(payload.sub);
		userCache[payload.sub] = user;
	}

	return { user: user, env };
};

export const requireAuth = (context: Context) => {
	if (!context.user) {
		throw new Error('Unauthorized');
	}

	return context.user;
};
