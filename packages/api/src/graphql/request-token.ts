import { AlgoliaClient } from '../algolia/algolia';
import { GraphQLError } from 'graphql';
import PasswordlessAuth from '../auth/passwordless';
import Mailer from '../sendgrid/sendgrid';
import { Context } from '../util/types';

export const requestTokenResolver = async (
	_: any,
	{ usernameOrEmail, publicKey }: { usernameOrEmail: string; publicKey: string },
	{ env }: Context
) => {
	let currentUser;
	const errorMessage = `Sorry, your ${
		publicKey ? 'public key is not connected with any account.' : 'email does not exist.'
	} Sign up to create an account.`;
	try {
		const algolia = new AlgoliaClient(env);

		if (publicKey) {
			currentUser = await algolia.getUserByPublicKey(publicKey);
		} else {
			currentUser = await algolia.getUserByEmail(usernameOrEmail);
			console.log(currentUser);
		}
	} catch (e) {
		throw new GraphQLError(errorMessage);
	}
	if (!currentUser) {
		throw new GraphQLError(errorMessage);
	}

	const passwordlessAuth = new PasswordlessAuth(env);
	let token = passwordlessAuth.generateToken();
	let ttl = 60 * 60 * 1000;
	await passwordlessAuth.storeOrUpdate(token, currentUser.id, ttl, '');
	const mailer = new Mailer(env);
	await mailer.sendLoginEmail(currentUser, token);
	return true;
};
