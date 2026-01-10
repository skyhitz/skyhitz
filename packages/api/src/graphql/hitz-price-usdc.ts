import { Context } from 'src/util/types';
import ContractClient from '../../contract';

/**
 * HITZ Price (in USDC) Resolver
 * 
 * Returns the HITZ/USDC reference price from the contract.
 * Price is in USDC per HITZ (e.g., 0.10 means 1 HITZ costs $0.10 USDC).
 * 
 * NOTE: This price is now FROZEN for security. It is used only as a reference
 * for staking calculations, not for active market pricing. The oracle bot
 * no longer updates this value to prevent price manipulation attacks.
 */
export const hitzPriceUsdcResolver = async (_: any, __: any, context: Context) => {
	const contract = new ContractClient(context.env);

	try {
		// Get oracle data from contract (price in stroops, last update timestamp)
		const [priceInStroops, lastUpdate] = await contract.getOracleData();
		
		// Convert stroops to USDC (1 USDC = 10^7 stroops)
		const priceInUsdc = Number(priceInStroops) / 10_000_000;
		
		console.log(`💰 HITZ price from oracle: $${priceInUsdc} USDC per HITZ (last updated: ${new Date(Number(lastUpdate) * 1000).toISOString()})`);
		
		return priceInUsdc;
	} catch (error) {
		console.error('❌ Error fetching HITZ price from oracle:', error);
		// Return default price if there's an error ($0.10 USDC per HITZ)
		return 0.10;
	}
};
