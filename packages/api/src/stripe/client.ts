import Stripe from 'stripe';

class StripeClient {
	public stripe!: Stripe;
	public webhookSecret!: string;
	constructor(private env: Env) {
		if (this.env.STRIPE_SECRET_KEY) {
			this.stripe = new Stripe(this.env.STRIPE_SECRET_KEY);
		}
		if (this.env.STRIPE_WEBHOOK_SECRET) {
			this.webhookSecret = this.env.STRIPE_WEBHOOK_SECRET;
		}
	}
}

export default StripeClient;
