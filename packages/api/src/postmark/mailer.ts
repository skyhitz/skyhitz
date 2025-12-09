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

	async sendCuratorAddedNotification(params: {
		curatorEmail: string;
		curatorName: string;
		curatorUserId: string;
		addedByName: string;
		loginToken: string;
	}) {
		// Magic login link that redirects to pending uploads after sign-in
		const redirectPath = '/profile/pending-uploads';
		const loginLink = `${this.env.APP_URL}/sign-in?token=${params.loginToken}&uid=${encodeURIComponent(params.curatorUserId)}&redirect=${encodeURIComponent(redirectPath)}`;
		
		const textBody = `Hi ${params.curatorName},

You have been added as a curator on Skyhitz by ${params.addedByName}!

As a curator, you can:
- Review and approve pending music uploads
- Rate the quality of submitted tracks
- Help maintain the quality standards of Skyhitz

Click here to sign in and start reviewing: ${loginLink}

Thank you for helping us curate great music!

The Skyhitz Team`;

		const htmlBody = `
			<h2>Welcome, Curator! 🎵</h2>
			<p>Hi ${params.curatorName},</p>
			<p>You have been added as a <strong>curator</strong> on Skyhitz by ${params.addedByName}!</p>
			
			<h3>What you can do as a curator:</h3>
			<ul>
				<li>Review and approve pending music uploads</li>
				<li>Rate the quality of submitted tracks</li>
				<li>Help maintain the quality standards of Skyhitz</li>
			</ul>
			
			<p><a href="${loginLink}" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold">Sign In & Start Reviewing</a></p>
			
			<p>Or copy and paste this link into your browser:</p>
			<p style="word-break:break-all;font-size:12px;color:#666">${loginLink}</p>
			
			<p>Thank you for helping us curate great music!</p>
			<p>The Skyhitz Team</p>
		`;

		return this.sendEmailInternal({
			to: params.curatorEmail,
			subject: 'You are now a Skyhitz Curator! 🎵',
			textBody,
			htmlBody,
		});
	}

	async sendCuratorRemovedNotification(params: {
		curatorEmail: string;
		curatorName: string;
		removedByName: string;
	}) {
		const textBody = `Hi ${params.curatorName},

Your curator status on Skyhitz has been removed by ${params.removedByName}.

You will no longer be able to review pending uploads.

If you believe this was a mistake, please contact support@skyhitz.io.

The Skyhitz Team`;

		const htmlBody = `
			<p>Hi ${params.curatorName},</p>
			<p>Your curator status on Skyhitz has been removed by ${params.removedByName}.</p>
			<p>You will no longer be able to review pending uploads.</p>
			<p>If you believe this was a mistake, please contact <a href="mailto:support@skyhitz.io">support@skyhitz.io</a>.</p>
			<p>The Skyhitz Team</p>
		`;

		return this.sendEmailInternal({
			to: params.curatorEmail,
			subject: 'Curator Status Removed - Skyhitz',
			textBody,
			htmlBody,
		});
	}

	async sendNewPendingUploadNotification(params: {
		curatorEmails: string[];
		uploaderName: string;
		trackTitle: string;
		trackArtist: string;
		pendingUploadId: string;
	}) {
		if (params.curatorEmails.length === 0) return { skipped: true };

		const dashboardUrl = `${this.env.APP_URL}/profile/pending-uploads`;
		
		const textBody = `A new track has been uploaded and is waiting for your review!

Track: "${params.trackTitle}" by ${params.trackArtist}
Uploaded by: ${params.uploaderName}

Review it now: ${dashboardUrl}

The Skyhitz Team`;

		const htmlBody = `
			<h2>New Upload Pending Review 🎵</h2>
			<p>A new track has been uploaded and is waiting for your review!</p>
			
			<div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
				<p style="margin:0"><strong>Track:</strong> "${params.trackTitle}"</p>
				<p style="margin:4px 0 0 0"><strong>Artist:</strong> ${params.trackArtist}</p>
				<p style="margin:4px 0 0 0"><strong>Uploaded by:</strong> ${params.uploaderName}</p>
			</div>
			
			<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold">Review Now</a></p>
			
			<p>The Skyhitz Team</p>
		`;

		// Send to all curators
		const promises = params.curatorEmails.map((email) =>
			this.sendEmailInternal({
				to: email,
				subject: `New Upload: "${params.trackTitle}" by ${params.trackArtist}`,
				textBody,
				htmlBody,
			})
		);

		return Promise.allSettled(promises);
	}

	async sendPendingMineNotification(params: {
		userName: string;
		userEmail: string;
		trackTitle: string;
		trackArtist?: string;
		similarTracks: Array<{
			id: string;
			title: string;
			artist?: string;
			similarity: number;
		}>;
		pendingMineId: string;
	}) {
		const similarTracksText = params.similarTracks
			.map((t, idx) => 
				`${idx + 1}. "${t.title}" by ${t.artist || 'Unknown'} (${(t.similarity * 100).toFixed(1)}% match)\n   Entry ID: ${t.id}`
			)
			.join('\n');

		const textBody = `A user attempted to mine a track that appears similar to existing content.

User: ${params.userName} (${params.userEmail})
New Track: "${params.trackTitle}" by ${params.trackArtist || 'Unknown'}

Similar tracks found:
${similarTracksText}

Pending Mine ID: ${params.pendingMineId}

To review, use GraphQL with the following mutations:
- approvePendingMine(id: "${params.pendingMineId}") - Create as new track
- mergePendingMine(id: "${params.pendingMineId}", targetEntryId: "...") - Merge to existing
- rejectPendingMine(id: "${params.pendingMineId}") - Reject

Timestamp: ${new Date().toISOString()}`;

		const htmlBody = `
			<h2>Pending Mine Review Required</h2>
			<p>A user attempted to mine a track that appears similar to existing content.</p>
			
			<h3>User Information</h3>
			<p><strong>Name:</strong> ${params.userName}<br>
			<strong>Email:</strong> ${params.userEmail}</p>
			
			<h3>New Track</h3>
			<p><strong>Title:</strong> ${params.trackTitle}<br>
			<strong>Artist:</strong> ${params.trackArtist || 'Unknown'}</p>
			
			<h3>Similar Tracks Found</h3>
			<ul>
				${params.similarTracks.map((t) => 
					`<li><strong>"${t.title}"</strong> by ${t.artist || 'Unknown'} 
					<em>(${(t.similarity * 100).toFixed(1)}% match)</em><br>
					<small>Entry ID: <code>${t.id}</code></small></li>`
				).join('')}
			</ul>
			
			<h3>Pending Mine ID</h3>
			<p><code>${params.pendingMineId}</code></p>
			
			<h3>Review Using GraphQL</h3>
			<p>Use the following GraphQL mutations to take action:</p>
			<ol>
				<li><strong>Approve (create new):</strong><br>
				<code>approvePendingMine(id: "${params.pendingMineId}")</code></li>
				<li><strong>Merge to existing:</strong><br>
				<code>mergePendingMine(id: "${params.pendingMineId}", targetEntryId: "...")</code></li>
				<li><strong>Reject:</strong><br>
				<code>rejectPendingMine(id: "${params.pendingMineId}")</code></li>
			</ol>
			
			<p><small>Timestamp: ${new Date().toISOString()}</small></p>
		`;

		return this.sendEmailInternal({
			to: 'support@skyhitz.io',
			subject: `Pending Mine Review: "${params.trackTitle}" by ${params.trackArtist || 'Unknown'}`,
			textBody,
			htmlBody,
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


