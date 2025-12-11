import { Context } from 'src/util/types';
import ContractClient from '../../contract';

/**
 * HITZ Price (in USDC) Resolver
 * 
 * Returns the current HITZ/USDC market price from the oracle.
 * Price is in USDC per HITZ (e.g., 0.10 means 1 HITZ costs $0.10 USDC).
 * 
 * This price is updated by the treasury oracle bot using Soroswap DEX data.
 * 
 * Note: GraphQL schema field name remains hitzPriceXlm for backward compatibility,
 * but the value now represents USDC price instead of XLM price.
 */
export const hitzPriceXlmResolver = async (_: any, __: any, context: Context) => {
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

