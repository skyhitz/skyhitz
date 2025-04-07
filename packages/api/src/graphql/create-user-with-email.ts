import { AlgoliaClient } from '../algolia/algolia';
import Mailer from '../sendgrid/sendgrid';
import StellarClient from '../stellar/operations';
import { Context, User } from '../util/types';
import { GraphQLError } from 'graphql';
import { sign } from '@tsndr/cloudflare-worker-jwt';
import UniqueIdGenerator from 'src/auth/unique-id-generator';
import Encryption from 'src/util/encryption';

export const createUserWithEmailResolver = async (_: any, args: any, ctx: Context) => {
	const { env } = ctx;
	const algolia = new AlgoliaClient(env);
	const mailer = new Mailer(env);
	const stellar = new StellarClient(env);
	const encryption = new Encryption(env);

	const { displayName, email, username, signedXDR } = args;
	if (!email) {
		throw new GraphQLError(`Email can't be an empty string`);
	}
	if (!username) {
		throw new GraphQLError(`Username can't be an empty string`);
	}

	// TODO: Make a proper fix
	const usernameLowercase = username.toLowerCase();

	// check if the provided signedXDR is valid and obtain publicKey
	let publicKey;
	if (signedXDR) {
		const { verified, source } = stellar.verifySourceSignatureOnXDR(signedXDR);
		if (!verified) {
			throw new GraphQLError('Invalid signed XDR');
		}
		publicKey = source;
	}

	const res = await algolia.getByUsernameOrEmailOrPublicKey(usernameLowercase, email, publicKey);
	if (res && res.email === email) {
		throw new GraphQLError('Email already exists, please sign in.');
	}
	if (res && res.username === usernameLowercase) {
		throw new GraphQLError('Username is taken.');
	}
	if (res && res.publicKey === publicKey) {
		throw new GraphQLError('Public Key is connected to another account, please sign in.');
	}

	// check if provided publicKey account exists on stellar
	if (publicKey) {
		try {
			await stellar.getAccount(publicKey);
		} catch {
			throw new GraphQLError(
				`Provided public key does not exist on the Stellar ${env.STELLAR_NETWORK} network. It must be created before it can be used to submit transactions.`
			);
		}
	}

	const newId = UniqueIdGenerator.generate();

	let user: User = {
		avatarUrl: '',
		backgroundUrl: '',
		displayName: displayName,
		description: '',
		username: usernameLowercase,
		email: email,
		version: 1,
		publishedAt: new Date().toISOString(),
		publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
		publicKey: publicKey ? publicKey : '',
		objectID: newId,
		id: newId,
		seed: '',
		lastPlayedEntry: undefined,
		twitter: '',
		instagram: '',
	};

	try {
		// create and sponsor a stellar account for the user if they don't have one yet
		if (!user.publicKey) {
			let { publicAddress, secret } = await stellar.createAndFundAccount();
			let seed = await encryption.encrypt(secret);
			user.publicKey = publicAddress;
			user.seed = seed;
		}

		await algolia.saveUser(user);
		mailer.sendWelcomeEmail(user.email);

		// if the user already provided signedXDR and it was valid
		// we can log in him already.
		// otherwise user has to log in via email.
		if (signedXDR) {
			const token = await sign(
				{
					id: user.id,
					email: user.email,
					version: user.version,
				} as any,
				env.JWT_SECRET
			);
			user.jwt = token;
			return {
				message: 'User created. You logged in successfully.',
				user: { ...user, managed: user.seed !== '' },
			};
		} else {
			return { message: 'User created.' };
		}
	} catch (e) {
		console.log(e);
		throw new GraphQLError('There was an error during user creation');
	}
};
