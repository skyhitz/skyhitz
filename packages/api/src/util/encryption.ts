async function createWebCryptoHash(input: string): Promise<string> {
	// Step 1: Encode the string into a Uint8Array
	const encoder = new TextEncoder();
	const data = encoder.encode(input);

	// Step 2: Hash the data using SHA-256
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	// Step 3: Convert the ArrayBuffer to a base64 string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashBase64 = btoa(String.fromCharCode(...hashArray));
	// Step 4: Return the first 32 characters of the base64 hash
	return hashBase64.substring(0, 32);
}

function uint8ArrayToHex(array: Uint8Array): string {
	return Array.from(array)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function generateRandomBytes(length: number): Uint8Array {
	const array = new Uint8Array(length);
	self.crypto.getRandomValues(array);
	return array;
}

class Encryption {
	private algorithm = 'AES-CTR';

	constructor(private env: Env) {}

	public async encrypt(text: string) {
		const iv = generateRandomBytes(16);
		const secretKey = await createWebCryptoHash(this.env.ISSUER_SEED);

		// Convert the base64 secret key to a CryptoKey
		const keyData = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));
		const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: this.algorithm }, false, ['encrypt']);

		// Convert text to ArrayBuffer for encryption
		const encoder = new TextEncoder();
		const textBuffer = encoder.encode(text);

		// Convert the IV to ArrayBuffer
		const ivBuffer = new Uint8Array(iv);

		// Encrypt the text
		const encryptedBuffer = await crypto.subtle.encrypt(
			{ name: this.algorithm, counter: ivBuffer, length: 64 }, // Specify the algorithm details
			cryptoKey,
			textBuffer
		);

		// Convert encrypted ArrayBuffer back to string
		const encryptedBytes = new Uint8Array(encryptedBuffer);
		const encryptedHex = Array.from(encryptedBytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		return `iv${uint8ArrayToHex(iv)}content${encryptedHex}`;
	}

	public async decrypt(combination: string) {
		const secretKey = await createWebCryptoHash(this.env.ISSUER_SEED);

		// Convert the base64 secret key to a CryptoKey for decryption
		const keyData = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));
		const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: this.algorithm }, false, ['decrypt']);

		const keyword = 'content';
		const hashIv = combination.substring(2, combination.indexOf(keyword));
		const hashContent = combination.substring(combination.indexOf(keyword) + keyword.length, combination.length);

		// Convert the IV and encrypted content from hex to Uint8Array
		const ivMatch = hashIv.match(/.{1,2}/g);
		if (!ivMatch) throw new Error('Invalid IV');

		const ivBuffer = new Uint8Array(ivMatch.map((byte) => parseInt(byte, 16)));

		const contentMatch = hashContent.match(/.{1,2}/g);
		if (!contentMatch) {
			throw new Error('Invalid encrypted content format');
		}

		const encryptedData = new Uint8Array(contentMatch.map((byte) => parseInt(byte, 16)));

		// Decrypt the data using the Web Crypto API
		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: this.algorithm, counter: ivBuffer, length: 64 }, // Specify the algorithm details
			cryptoKey,
			encryptedData
		);

		// Convert the decrypted ArrayBuffer back to string
		const decoder = new TextDecoder();
		return decoder.decode(decryptedBuffer);
	}
}

export default Encryption;
