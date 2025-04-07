import { AlgoliaClient } from 'src/algolia/algolia';
import StellarClient from 'src/stellar/operations';
import StripeClient from 'src/stripe/client';
import { createUserWithEmailResolver } from 'src/graphql/create-user-with-email';
import { Context } from 'src/util/types';
import KrakenClient from 'src/kraken/client';
import Mailer from 'src/sendgrid/sendgrid';

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
	const sig = request.headers.get('stripe-signature');
	if (!sig) {
		return new Response('No signature', { status: 400 });
	}

	const body = await request.text();
	const { stripe, webhookSecret } = new StripeClient(env);

	let event;
	try {
		event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
	} catch (err: any) {
		console.error('Webhook signature verification failed:', err.message);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	try {
		switch (event.type) {
			case 'payment_intent.succeeded':
				const paymentIntentSucceeded = event.data.object;
				console.log('Processing payment:', paymentIntentSucceeded.id);

				if (paymentIntentSucceeded.status === 'succeeded') {
					const amount = paymentIntentSucceeded.amount;
					const userEmail = paymentIntentSucceeded.receipt_email;
					const latestCharge = paymentIntentSucceeded.latest_charge as string;

					if (!latestCharge) {
						throw new Error('No charge found for payment');
					}

					if (!userEmail) {
						console.warn('No email provided for payment:', paymentIntentSucceeded.id);
						return new Response(null, { status: 200 });
					}

					// Get charge details to calculate fees
					const charge = await stripe.charges.retrieve(latestCharge);
					if (!charge.balance_transaction) {
						throw new Error('No balance transaction found');
					}

					const balanceTx = charge.balance_transaction as string;
					const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTx);

					const netAmount = balanceTransaction.net;
					const stripeFee = balanceTransaction.fee;

					console.log('Payment details:', {
						paymentId: paymentIntentSucceeded.id,
						gross: amount,
						fee: stripeFee,
						net: netAmount,
					});

					const xlmAmount = await buyXLMWithUSD(netAmount, userEmail, env);
					console.log('Successfully processed payment:', {
						paymentId: paymentIntentSucceeded.id,
						email: userEmail,
						grossAmount: amount,
						stripeFee,
						netAmount,
						xlmAmount,
					});

					return new Response(
						JSON.stringify({
							email: userEmail,
							grossAmount: amount,
							stripeFee,
							netAmount,
							xlmAmount,
							price: netAmount / xlmAmount,
						}),
						{
							status: 200,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				break;

			default:
				console.log(`Unhandled event type ${event.type}`);
		}

		return new Response(null, { status: 200 });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

async function buyXLMWithUSD(amount: number, email: string, env: Env) {
	if (amount <= 0) {
		throw new Error('Invalid amount');
	}
	const krakenClient = new KrakenClient(env);
	try {
		const usdAmount = amount / 100; // Convert cents back to dollars for Kraken

		const { result, xlmAmount } = await krakenClient.buyAndWithdrawXLM(usdAmount);

		if (result?.refid) {
			const algolia = new AlgoliaClient(env);

			await algolia.saveWithdrawal({
				objectID: result.refid,
				amount: xlmAmount,
				status: 'pending',
				email: email,
				timestamp: Date.now(),
			});
		}

		await sendFundsToUser(email, xlmAmount, env);

		return xlmAmount;
	} catch (error: any) {
		console.error('Error in processing payment:', error);
		throw new Error('Error processing payment: ' + error.message);
	}
}

async function sendFundsToUser(email: string, amount: number, env: Env) {
	const algolia = new AlgoliaClient(env);
	const stellar = new StellarClient(env);
	const user = await algolia.getUserByEmail(email);

	try {
		if (!user) {
			// Create new user
			const username = email.split('@')[0];
			const ctx: Context = { env };

			await createUserWithEmailResolver(null, { email, username, displayName: username }, ctx);
			const newUser = await algolia.getUserByEmail(email);

			if (newUser && newUser.publicKey) {
				await stellar.pay(newUser.publicKey, amount);
				await algolia.updateUserMinBalance(newUser.objectID, amount);
			} else {
				throw new Error(`Failed to create user account properly: ${!newUser ? 'User not found' : 'Missing public key'}`);
			}
		} else {
			// Handle existing user
			if (user && !user.publicKey) {
				throw new Error('User exists but has no public key');
			}
			if (user && user.publicKey) {
				await stellar.pay(user.publicKey, amount);
				await algolia.updateUserMinBalance(user.objectID, amount);
			}
		}
	} catch (error) {
		console.error('Failed to process payment:', error);
		const mailer = new Mailer(env);
		await mailer.sendSupportEmail(email, error, amount);
		throw new Error('Payment processing failed. Support has been notified.');
	}
}
