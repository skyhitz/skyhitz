import sgMail from '@sendgrid/mail';
import { User } from '../util/types';

class Mailer {
	constructor(private env: Env) {
		if (this.env.SENDGRID_API_KEY) sgMail.setApiKey(this.env.SENDGRID_API_KEY);
	}

	sendNftSoldEmail(email: string) {
		return this.sendMail(email, '¡You just sold a music NFT!', 'd-6687be08e2934811b986c23132b548c1');
	}

	sendNftInvestEmail(email: string) {
		return this.sendMail(email, '¡You just invested in a music NFT!', 'd-0d6857da22a54950b1350666181393da');
	}

	sendWelcomeEmail(email: string) {
		return this.sendMail(email, 'Welcome to Skyhitz', 'd-08b9dce0c7d94526aeee9ec06dc1994d');
	}

	sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
		return sgMail.send({
			to,
			from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
			subject,
			text,
		});
	}

	async sendLoginEmail(currentUser: User, token: string) {
		return await sgMail.send({
			to: currentUser.email,
			from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
			subject: 'Log In To Your Skyhitz Account',
			templateId: 'd-906d105dea7e43d79d8df30c739137a1',
			personalizations: [
				{
					to: [{ email: currentUser.email }],
					dynamicTemplateData: {
						login_link: `${this.env.APP_URL}/sign-in?token=${token}&uid=${encodeURIComponent(currentUser.id)}`,
					},
				},
			],
		});
	}

	sendSupportEmail(userEmail: string, error: any, amount: number) {
		const msg = {
			to: 'support@skyhitz.io',
			from: 'hello@skyhitz.io',
			subject: 'Failed User Creation - Manual Review Required',
			text: `Failed to create user account for ${userEmail}.
Payment Amount: ${amount} XLM
Error: ${error.message}
Timestamp: ${new Date().toISOString()}

Please create the user account manually and review the case.`,
		};
		return sgMail.send(msg);
	}

	private sendMail(email: string, subject: string, templateId: string) {
		return sgMail.send({
			to: email,
			from: { email: 'hello@skyhitz.io', name: 'Skyhitz' },
			subject: subject,
			templateId: templateId,
		});
	}
}

export default Mailer;
