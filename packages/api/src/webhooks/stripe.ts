import { AlgoliaClient } from 'src/algolia/algolia';
import StellarClient from 'src/stellar/operations';
import StripeClient from 'src/stripe/client';
import { createUserWithEmailResolver } from 'src/graphql/create-user-with-email';
import { Context } from 'src/util/types';
import KrakenClient from 'src/kraken/client';
import Mailer from 'src/postmark/mailer';
import ContractClient from '../../contract';
import SoroswapClient from 'src/soroswap/client';

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

					const { xlmAmount, hitzAmount } = await buyHITZWithUSD(netAmount, userEmail, env);
					console.log('Successfully processed payment:', {
						paymentId: paymentIntentSucceeded.id,
						email: userEmail,
						grossAmount: amount,
						stripeFee,
						netAmount,
						xlmAmount,
						hitzAmount,
					});

					return new Response(
						JSON.stringify({
							email: userEmail,
							grossAmount: amount,
							stripeFee,
							netAmount,
							xlmAmount,
							hitzAmount,
							price: netAmount / hitzAmount,
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

/**
 * Buy HITZ with USD via Kraken (USD → XLM) and Soroswap (XLM → HITZ)
 * 
 * Flow:
 * 1. Buy XLM from Kraken with USD
 * 2. XLM arrives at issuer account (Kraken withdrawal destination)
 * 3. Swap XLM to HITZ via Soroswap
 * 4. Send HITZ to user's wallet
 */
async function buyHITZWithUSD(amount: number, email: string, env: Env): Promise<{ xlmAmount: number; hitzAmount: number }> {
	if (amount <= 0) {
		throw new Error('Invalid amount');
	}
	const krakenClient = new KrakenClient(env);
	try {
		const usdAmount = amount / 100; // Convert cents back to dollars for Kraken

		// Step 1: Buy XLM from Kraken
		const { result, xlmAmount } = await krakenClient.buyAndWithdrawXLM(usdAmount);
		console.log(`Kraken: Bought ${xlmAmount} XLM for $${usdAmount}`);

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

		// Step 2: Swap XLM to HITZ via Soroswap (using issuer account)
		// Keep 2 XLM for network fees, swap the rest
		const xlmToSwap = Math.max(0, xlmAmount - 2);
		
		if (xlmToSwap <= 0) {
			throw new Error(`Insufficient XLM amount for swap: ${xlmAmount} XLM (need > 2 XLM)`);
		}

		const soroswap = new SoroswapClient(env);
		const swapResult = await soroswap.swapXLMToHITZ(xlmToSwap, env.ISSUER_SEED);
		const hitzAmount = swapResult.hitzAmount;
		console.log(`Soroswap: Swapped ${xlmToSwap} XLM → ${hitzAmount} HITZ`);

		// Step 3: Send HITZ to user
		await sendHITZToUser(email, hitzAmount, env);

		return { xlmAmount, hitzAmount };
	} catch (error: any) {
		console.error('Error in processing payment:', error);
		throw new Error('Error processing payment: ' + error.message);
	}
}

/**
 * Send HITZ tokens to a user's wallet
 * Creates user account if they don't exist
 */
async function sendHITZToUser(email: string, hitzAmount: number, env: Env) {
	const algolia = new AlgoliaClient(env);
	const stellar = new StellarClient(env);
	const contract = new ContractClient(env);
	
	let user = await algolia.getUserByEmail(email);

	try {
		if (!user) {
			// Create new user
			const username = email.split('@')[0];
			const ctx: Context = { env };

			await createUserWithEmailResolver(null, { email, username, displayName: username }, ctx);
			user = await algolia.getUserByEmail(email);

			if (!user || !user.publicKey) {
				throw new Error(`Failed to create user account properly: ${!user ? 'User not found' : 'Missing public key'}`);
			}
		}

		if (!user.publicKey) {
			throw new Error('User exists but has no public key');
		}

		// Ensure user has HITZ trustline
		if (user.seed) {
			const Encryption = (await import('src/util/encryption')).default;
			const encryption = new Encryption(env);
			const userSeed = await encryption.decrypt(user.seed);
			await stellar.ensureHitzTrustline(userSeed);
		}

		// Transfer HITZ from issuer to user using the contract
		// transferHitz expects amount in HITZ (not stroops)
		await contract.transferHitz(env.ISSUER_SEED, user.publicKey, hitzAmount);
		
		console.log(`Sent ${hitzAmount} HITZ to ${user.publicKey}`);

	} catch (error) {
		console.error('Failed to send HITZ to user:', error);
		const mailer = new Mailer(env);
		await mailer.sendSupportEmail(email, error, hitzAmount);
		throw new Error('Payment processing failed. Support has been notified.');
	}
}
