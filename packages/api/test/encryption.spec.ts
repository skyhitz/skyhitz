import { describe, it, expect } from 'vitest';
import Encryption from '../src/util/encryption';

describe('Encryption', () => {
	const env = {
		ISSUER_SEED: '',
		APP_URL: '',
		ALGOLIA_APP_ID: '',
		ENV: '',
		JWT_SECRET: '',
		ALGOLIA_ADMIN_API_KEY: '',
		SENDGRID_API_KEY: '',
		STELLAR_NETWORK: '',
		PINATA_JWT: '',
		ALCHEMY_API_KEY: '',
	};

	const encryption = new Encryption(env);

	it('should decrypt a valid combination', async () => {
		const combination = '';
		const decryptedValue = await encryption.decrypt(combination);

		console.log(decryptedValue);

		expect(decryptedValue).toBe('');
	});

	it('should encrypt a valid combination', async () => {
		const combination = '';
		const encrypted = await encryption.encrypt('');

		console.log('encrypted value', encrypted);

		expect(encrypted).toBe('');
	});
});
