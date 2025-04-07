import { GraphQLError } from 'graphql';
import { AlgoliaClient } from '../algolia/algolia';
import Mailer from '../sendgrid/sendgrid';
import { Context } from '../util/types';

export const submitLinkResolver = async (_: any, { link, email }: { link: string; email: string }, context: Context) => {
	const { env } = context;
	const algolia = new AlgoliaClient(env);
	const mailer = new Mailer(env);

	// Add the link to the :submit index
	try {
		await algolia.addToSubmitIndex(email, link);
	} catch (e) {
		console.log(e);
		throw new GraphQLError('Failed to add link to the submit index');
	}

	// Notify your personal email
	try {
		await mailer.sendEmail({
			to: 'alejandro@skyhitzmusic.com',
			subject: 'New Link Submission',
			text: `A new link has been submitted by ${email} : ${link}`,
		});
	} catch (e) {
		throw new GraphQLError('Failed to send notification email');
	}

	return { message: 'Link submitted successfully', success: true };
};
