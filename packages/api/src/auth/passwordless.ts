// import { webcrypto, timingSafeEqual } from 'node:crypto';
import { SearchIndex } from 'algoliasearch';
import { AlgoliaClient } from '../algolia/algolia';

class PasswordlessAuth {
	private passwordlessIndex: SearchIndex;
	constructor(private env: Env) {
		this.passwordlessIndex = new AlgoliaClient(this.env).indices.passwordlessIndex;
	}
	private BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

	private encodeBase58(buffer: Uint8Array): string {
		let carry;
		const digits = [0];

		for (let i = 0; i < buffer.length; i++) {
			carry = buffer[i];
			for (let j = 0; j < digits.length; ++j) {
				carry += digits[j] << 8;
				digits[j] = carry % 58;
				carry = (carry / 58) | 0;
			}

			while (carry) {
				digits.push(carry % 58);
				carry = (carry / 58) | 0;
			}
		}

		for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
			digits.push(0);
		}

		return digits
			.reverse()
			.map((digit) => this.BASE58_ALPHABET[digit])
			.join('');
	}

	private async hashToken(token: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(token);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return Buffer.from(hashBuffer).toString('hex');
	}

	private timingSafeEqual(a: string, b: string): boolean {
		const aBuffer = Buffer.from(a, 'hex');
		const bBuffer = Buffer.from(b, 'hex');

		if (aBuffer.length !== bBuffer.length) {
			return false;
		}

		return crypto.subtle.timingSafeEqual(aBuffer, bBuffer);
	}

	public generateToken(randomBytes = 16): string {
		const array = new Uint8Array(randomBytes);
		crypto.getRandomValues(array);
		return this.encodeBase58(array);
	}

	public async authenticate(token: string, uid: string): Promise<{ valid: boolean; referrer: string | null }> {
		if (!token || !uid) {
			throw new Error('TokenStore:authenticate called with invalid parameters');
		}

		let obj: any = await this.passwordlessIndex.getObject(uid);
		if (!obj) {
			return { valid: false, referrer: null };
		}
		if (Date.now() > obj.ttl) {
			return { valid: false, referrer: null };
		}

		const hashedToken = await this.hashToken(token);

		if (this.timingSafeEqual(hashedToken, obj.token)) {
			return { valid: true, referrer: obj.origin };
		} else {
			return { valid: false, referrer: null };
		}
	}

	public async storeOrUpdate(token: string, uid: string, msToLive: number, originUrl?: string) {
		if (!token || !uid || !msToLive || !this.isNumber(msToLive)) {
			throw new Error('TokenStore:storeOrUpdate called with invalid parameters');
		}

		const hashedToken = await this.hashToken(token);
		originUrl = originUrl || '';
		await this.passwordlessIndex.saveObject({
			objectID: uid,
			token: hashedToken,
			origin: originUrl,
			ttl: Date.now() + msToLive,
		});
		return true;
	}

	public async invalidateUser(uid: string) {
		if (!uid) {
			throw new Error('TokenStore:invalidateUser called with invalid parameters');
		}

		await this.passwordlessIndex.deleteObject(uid);
		return true;
	}

	private isNumber(n: any): boolean {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
}

export default PasswordlessAuth;
