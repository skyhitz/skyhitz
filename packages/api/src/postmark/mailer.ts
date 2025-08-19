import { User } from '../util/types';

class Mailer {
	constructor(private env: Env) {}

	async sendNftSoldEmail(email: string) {
		return this.sendEmailInternal({
			to: email,
			subject: '¡You just sold a music NFT!',
			textBody: 'Congratulations! You just sold a music NFT on Skyhitz.',
			htmlBody:
				'<p>Congratulations! 🎉</p><p>You just sold a music NFT on <strong>Skyhitz</strong>.</p><p>Keep creating and sharing your music!</p>',
		});
	}

	async sendNftInvestEmail(email: string) {
		return this.sendEmailInternal({
			to: email,
			subject: '¡You just invested in a music NFT!',
			textBody: 'Great news! Your investment in a music NFT was successful.',
			htmlBody:
				'<p>Great news! 🚀</p><p>Your investment in a music NFT was <strong>successful</strong>.</p><p>Thanks for supporting artists on Skyhitz.</p>',
		});
	}

	async sendWelcomeEmail(email: string) {
		return this.sendEmailInternal({
			to: email,
			subject: 'Welcome to Skyhitz',
			textBody: 'Welcome to Skyhitz! We are excited to have you on board.',
			htmlBody:
				'<p>Welcome to <strong>Skyhitz</strong>! 🎧</p><p>We are excited to have you on board.</p><p>Start exploring and creating today.</p>',
		});
	}

	async sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
		return this.sendEmailInternal({ to, subject, textBody: text });
	}

	async sendLoginEmail(currentUser: User, token: string) {
		const loginLink = `${this.env.APP_URL}/sign-in?token=${token}&uid=${encodeURIComponent(currentUser.id)}`;
		const htmlBody = `
			<p>Hi,</p>
			<p>Click the button below to log in to your Skyhitz account:</p>
			<p><a href="${loginLink}" style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px">Log In</a></p>
			<p>Or copy and paste this link into your browser:</p>
			<p><a href="${loginLink}">${loginLink}</a></p>
		`;

		return this.sendEmailInternal({
			to: currentUser.email,
			subject: 'Log In To Your Skyhitz Account',
			textBody: `Use this link to log in to your Skyhitz account: ${loginLink}`,
			htmlBody,
		});
	}

	async sendSupportEmail(userEmail: string, error: any, amount: number) {
		const textBody = `Failed to create user account for ${userEmail}.
Payment Amount: ${amount} XLM
Error: ${error?.message || String(error)}
Timestamp: ${new Date().toISOString()}

Please create the user account manually and review the case.`;

		return this.sendEmailInternal({
			to: 'support@skyhitz.io',
			subject: 'Failed User Creation - Manual Review Required',
			textBody,
		});
	}

	private async sendEmailInternal(params: {
		to: string;
		subject: string;
		textBody?: string;
		htmlBody?: string;
	}) {
		const serverToken = (this.env as any).POSTMARK_SERVER_TOKEN;
		if (!serverToken) {
			console.warn('POSTMARK_SERVER_TOKEN is not set; skipping email send');
			return { skipped: true } as const;
		}

		const payload: Record<string, string> = {
			From: 'hello@skyhitz.io',
			To: params.to,
			Subject: params.subject,
		};
		if (params.textBody) payload.TextBody = params.textBody;
		if (params.htmlBody) payload.HtmlBody = params.htmlBody;

		const response = await fetch('https://api.postmarkapp.com/email', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'X-Postmark-Server-Token': serverToken,
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Postmark send failed: ${response.status} ${errorText}`);
		}

		return response.json();
	}
}

export default Mailer;


