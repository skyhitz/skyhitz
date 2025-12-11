/**
 * Stellar/Soroban shared constants
 */

// 1 XLM/HITZ = 10,000,000 stroops
export const STROOPS = 10_000_000;

// Soroban wrapped asset contract IDs (mainnet)
export const XLM_CONTRACT_ID = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';
export const HITZ_CONTRACT_ID = 'CBS5ZVKSSUKF4JY77CKUZPN72EDUM3OOGPYZKFC3KQVONXPJTF6UODD7';

// USDC Soroban contract IDs
export const USDC_CONTRACT_ID_MAINNET = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
export const USDC_CONTRACT_ID_TESTNET = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

/**
 * Get USDC contract ID for the given network
 */
export function getUsdcContractId(network: string | undefined): string {
	return network === 'testnet' ? USDC_CONTRACT_ID_TESTNET : USDC_CONTRACT_ID_MAINNET;
}

// Horizon URLs
export const MAINNET_HORIZON_URL = 'https://horizon.stellar.org';
export const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';

/**
 * Convert stroops to display units (XLM or HITZ)
 */
export function stroopsToToken(stroops: number | bigint): number {
	return Number(stroops) / STROOPS;
}

/**
 * Convert display units (XLM or HITZ) to stroops
 */
export function tokenToStroops(amount: number): bigint {
	return BigInt(Math.floor(amount * STROOPS));
}

/**
 * Get horizon URL for network
 */
export function getHorizonUrl(network: string | undefined): string {
	return network === 'testnet' ? TESTNET_HORIZON_URL : MAINNET_HORIZON_URL;
}

