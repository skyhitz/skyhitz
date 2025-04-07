import crypto from 'crypto';
import querystring from 'querystring';
import { KrakenAddOrderRes, KrakenWithdrawStatus } from 'src/util/types';

function getKrakenSignature(urlPath: string, data: any, secret: string) {
	if (!urlPath || !data || !secret) {
		throw new Error('Missing required parameters');
	}
	let encoded;
	if (typeof data === 'string') {
		const jsonData = JSON.parse(data);
		encoded = jsonData.nonce + data;
	} else if (typeof data === 'object') {
		const dataStr = querystring.stringify(data);
		encoded = data.nonce + dataStr;
	} else {
		throw new Error('Invalid data type');
	}

	const sha256Hash = crypto.createHash('sha256').update(encoded).digest();
	const message = urlPath + sha256Hash.toString('binary');
	const secretBuffer = Buffer.from(secret, 'base64');
	const hmac = crypto.createHmac('sha512', secretBuffer);
	hmac.update(message, 'binary');
	const signature = hmac.digest('base64');
	return signature;
}

export function getKrakenHeaders(env: Env, path: string, postData: any) {
	const apiKey = env.KRAKEN_API_KEY;
	const apiSecret = env.KRAKEN_API_PRIVATE_KEY;

	if (!apiKey || !apiSecret) {
		throw new Error('Missing required env variables');
	}

	const signature = getKrakenSignature(path, postData, apiSecret);
	return {
		'API-Key': apiKey,
		'API-Sign': signature,
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
	};
}

export const krakenApiUrl = 'https://api.kraken.com';

class KrakenClient {
	constructor(private env: Env) {}

	async withdrawStatus() {
		const path = '/0/private/WithdrawStatus';
		const nonce = Date.now().toString();
		const postData = {
			nonce,
			asset: 'XXLM',
		};

		const headers = getKrakenHeaders(this.env, path, postData);

		const statusRes = await fetch(`${krakenApiUrl}${path}`, {
			method: 'POST',
			headers,
			body: querystring.stringify(postData),
		});

		if (!statusRes.ok) {
			throw new Error(`HTTP error! status: ${statusRes.status}`);
		}

		const statusData: KrakenWithdrawStatus = await statusRes.json();

		if (statusData.error?.length > 0) {
			throw new Error(`Kraken API error: ${statusData.error.join(', ')}`);
		}

		return statusData;
	}

	async getXLMPrice() {
		const response = await fetch(`${krakenApiUrl}/0/public/Ticker?pair=XLMUSD`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data: any = await response.json();
		if (!data?.result?.XXLMZUSD?.c?.[0]) {
			throw new Error('Invalid response format from Kraken API');
		}
		return parseFloat(data.result.XXLMZUSD.c[0]);
	}

	async buyXLM(xlmAmount: number) {
		const path = '/0/private/AddOrder';
		const postData = {
			nonce: Date.now().toString(),
			pair: 'XXLMZUSD',
			type: 'buy',
			ordertype: 'market',
			volume: xlmAmount.toString(),
		};

		const headers = await getKrakenHeaders(this.env, path, postData);

		const buyRes = await fetch(`${krakenApiUrl}${path}`, {
			method: 'POST',
			headers,
			body: querystring.stringify(postData),
		});

		const res: KrakenAddOrderRes = await buyRes.json();

		return { ...res, xlmAmount };
	}

	async buyXLMwithUSD(usdAmount: number) {
		if (usdAmount < 1) {
			throw new Error('Minimum USD amount is 1');
		}
		// get XLM price from api

		const price = await this.getXLMPrice();
		// kraken has a fee of 0.0829%

		const priceWithFee = price * 1.000829;
		const xlmAmount = usdAmount / priceWithFee;
		return this.buyXLM(xlmAmount);
	}

	async withdrawXLM(xlmAmount: number) {
		if (!this.env.ISSUER_ID) {
			throw new Error('ISSUER_ID not configured');
		}
		const path = '/0/private/Withdraw';
		const postData = {
			nonce: Date.now().toString(),
			asset: 'XXLM',
			key: 'skyhitz',
			amount: xlmAmount.toString(),
			address: this.env.ISSUER_ID,
		};

		const headers = await getKrakenHeaders(this.env, path, postData);

		//  1 minute and 16 seconds to send XLM from Kraken to our Account

		const withdrawRes = await fetch(`${krakenApiUrl}${path}`, {
			method: 'POST',
			headers,
			body: querystring.stringify(postData),
		});

		const withdrawData: { result: { refid: string } } = await withdrawRes.json();
		return withdrawData;
	}

	async buyAndWithdrawXLM(usdAmount: number) {
		try {
			const { xlmAmount } = await this.buyXLMwithUSD(usdAmount);
			const withdrawData = await this.withdrawXLM(xlmAmount);
			return { xlmAmount, ...withdrawData };
		} catch (error: any) {
			throw new Error(`Failed to buy and withdraw XLM: ${error.message}`);
		}
	}
}

export default KrakenClient;
