import StripeClient from 'src/stripe/client';
import { Context } from '../util/types';

export const createPaymentIntentResolver = async (_: any, args: any, ctx: Context) => {
	const { amount } = args;
	const { stripe } = new StripeClient(ctx.env);

	// Create a PaymentIntent with the order amount and currency
	const paymentIntent = await stripe.paymentIntents.create({
		amount: amount,
		currency: 'usd',
		// In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
		automatic_payment_methods: {
			enabled: true,
		},
	});
	return {
		clientSecret: paymentIntent.client_secret,
	};
};
