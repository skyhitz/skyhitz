export interface IConfig {
	APP_URL: string;
	ENV: string;
	JWT_SECRET: string;
	ISSUER_ID: string;
	ISSUER_SEED: string;
	ALGOLIA_APP_ID: string;
	ALGOLIA_ADMIN_API_KEY: string;
	POSTMARK_SERVER_TOKEN: string;
	STELLAR_NETWORK: string;
	STRIPE_SECRET_KEY: string;
	STRIPE_WEBHOOK_SECRET: string;
	PINATA_JWT: string;
	ALCHEMY_API_KEY: string;
	KRAKEN_API_KEY: string;
	KRAKEN_API_PRIVATE_KEY: string;
	R2_ACCESS_KEY_ID: string;
	R2_SECRET_ACCESS_KEY: string;
	R2_ENDPOINT: string;
	R2_BUCKET: string;
}
