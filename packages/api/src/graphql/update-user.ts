import * as yup from 'yup';
import { AlgoliaClient } from '../algolia/algolia';
import { ipfsProtocol } from '../constants/constants';
import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { Context, User } from 'src/util/types';
import PinataClient from 'src/util/pinanta'; // Import the PinataClient class

type UpdateUserArgs = {
	avatarUrl?: string | null;
	backgroundUrl?: string | null;
	displayName?: string | null;
	description?: string | null;
	username?: string | null;
	email?: string | null;
};

const updateUserSchema: yup.SchemaOf<UpdateUserArgs> = yup.object().shape({
	avatarUrl: yup.string(),
	backgroundUrl: yup.string(),
	description: yup.string(),
	username: yup
		.string()
		.required('Username is required.')
		.min(2, 'Username is minimum 2 characters.')
		.lowercase('Username must be lowercase')
		.matches(/^[a-z0-9_-]+$/, 'Usernames cannot have spaces or special characters'),
	displayName: yup.string().required('Display name is required.').min(2, 'Display name is minimum 2 characters.'),
	email: yup.string().required('Email is required').email('Please enter a valid email.'),
	twitter: yup.string(),
	instagram: yup.string(),
});

export const updateUserResolver = async (_: any, updateUserArgs: UpdateUserArgs, ctx: Context) => {
	const user = requireAuth(ctx);
	const algolia = new AlgoliaClient(ctx.env);
	const pinanta = new PinataClient(ctx.env);
	const validatedUpdate = await updateUserSchema.validate(updateUserArgs, {
		stripUnknown: true,
	});
	if (!validatedUpdate.username || !validatedUpdate.email) {
		throw new GraphQLError('Invalid update user data');
	}
	const existingUser = await algolia.getByUsernameOrEmailExcludingId(validatedUpdate.username, validatedUpdate.email, user.id);
	if (existingUser) {
		if (existingUser.email === validatedUpdate.email) {
			throw new GraphQLError('Account with given email already exists');
		}
		if (existingUser.username === validatedUpdate.username) {
			throw new GraphQLError('Username is already taken');
		}
	}
	if (validatedUpdate.avatarUrl) {
		const result = await pinanta.pinIpfsFile(validatedUpdate.avatarUrl.replace(ipfsProtocol, ''), `${user.username}-image`);
		if (!result) {
			throw new GraphQLError("Couldn't pin image to pinata!");
		}
		console.log('Pinned image!');
	}
	if (validatedUpdate.backgroundUrl) {
		const result = await pinanta.pinIpfsFile(validatedUpdate.backgroundUrl.replace(ipfsProtocol, ''), `${user.username}-backgroundimage`);
		if (!result) {
			throw new GraphQLError("Couldn't pin background image to pinata!");
		}
		console.log('Pinned background image!');
	}
	const userUpdate = {
		...user,
		...validatedUpdate,
	};
	await algolia.updateUser(userUpdate as User);
	return { ...userUpdate, managed: userUpdate.seed !== '' };
};
