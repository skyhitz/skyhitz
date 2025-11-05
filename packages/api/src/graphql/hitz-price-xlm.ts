import { Context } from 'src/util/types';
import ContractClient from '../../contract';

/**
 * HITZ Price (in XLM) Resolver
 * 
 * Returns the current HITZ/XLM market price from the oracle.
 * Price is in XLM per HITZ (e.g., 0.01 means 1 HITZ costs 0.01 XLM).
 * 
 * This price is updated by the treasury oracle bot using Soroswap DEX data.
 */
export const hitzPriceXlmResolver = async (_: any, __: any, context: Context) => {
	const contract = new ContractClient(context.env);

	try {
		// Get oracle data from contract (price in stroops, last update timestamp)
		const [priceInStroops, lastUpdate] = await contract.getOracleData();
		
		// Convert stroops to XLM (1 XLM = 10^7 stroops)
		const priceInXlm = Number(priceInStroops) / 10_000_000;
		
		console.log(`💰 HITZ price from oracle: ${priceInXlm} XLM per HITZ (last updated: ${new Date(Number(lastUpdate) * 1000).toISOString()})`);
		
		return priceInXlm;
	} catch (error) {
		console.error('❌ Error fetching HITZ price from oracle:', error);
		// Return default price if there's an error (0.01 XLM per HITZ)
		return 0.01;
	}
};

