import { AlgoliaClient } from 'src/algolia/algolia';
import StripeClient from 'src/stripe/client';
import KrakenClient from 'src/kraken/client';

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

					const { xlmAmount, refid } = await initiateXLMPurchase(netAmount, userEmail, env);
					console.log('Successfully initiated purchase:', {
						paymentId: paymentIntentSucceeded.id,
						email: userEmail,
						grossAmount: amount,
						stripeFee,
						netAmount,
						xlmAmount,
						krakenRefId: refid,
						status: 'pending_withdrawal',
					});

					// Return immediately - the cron job will process the swap once XLM arrives
					return new Response(
						JSON.stringify({
							email: userEmail,
							grossAmount: amount,
							stripeFee,
							netAmount,
							xlmAmount,
							krakenRefId: refid,
							status: 'pending_withdrawal',
							message: 'Purchase initiated. HITZ will be delivered once XLM withdrawal completes (~1-2 minutes).',
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
 * Initiate XLM purchase via Kraken (USD → XLM)
 * 
 * This function only buys XLM and initiates the withdrawal.
 * The actual swap (XLM → HITZ) and delivery happens asynchronously
 * via the cron job once the Kraken withdrawal completes (~1-2 minutes).
 * 
 * Flow:
 * 1. Buy XLM from Kraken with USD
 * 2. Initiate withdrawal to issuer account
 * 3. Save pending withdrawal to Algolia
 * 4. Return immediately (cron job handles the rest)
 */
async function initiateXLMPurchase(
	amount: number,
	email: string,
	env: Env
): Promise<{ xlmAmount: number; refid: string }> {
	if (amount <= 0) {
		throw new Error('Invalid amount');
	}

	const krakenClient = new KrakenClient(env);
	const algolia = new AlgoliaClient(env);

	try {
		const usdAmount = amount / 100; // Convert cents back to dollars for Kraken

		// Buy XLM from Kraken and initiate withdrawal
		const { result, xlmAmount } = await krakenClient.buyAndWithdrawXLM(usdAmount);
		console.log(`Kraken: Bought ${xlmAmount} XLM for $${usdAmount}`);

		if (!result?.refid) {
			throw new Error('Kraken withdrawal did not return a refid');
		}

		// Save to Algolia for the cron job to process
		await algolia.saveWithdrawal({
			objectID: result.refid,
			amount: xlmAmount,
			status: 'pending',
			email: email,
			timestamp: Date.now(),
		});

		console.log(`📝 Saved pending withdrawal ${result.refid} for ${email}`);
		console.log(`⏳ Cron job will process swap once XLM arrives (~1-2 minutes)`);

		return { xlmAmount, refid: result.refid };

	} catch (error: any) {
		console.error('Error initiating XLM purchase:', error);
		throw new Error('Error initiating purchase: ' + error.message);
	}
}
