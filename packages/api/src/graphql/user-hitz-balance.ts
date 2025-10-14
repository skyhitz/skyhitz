import { Context } from 'src/util/types';
import { requireAuth } from 'src/auth/auth-context';
import ContractClient from '../../contract';

/**
 * User HITZ Balance Resolver
 * 
 * Returns the user's HITZ token balance from the smart contract.
 * HITZ is the platform's native token used for staking and rewards.
 */
export const userHitzBalanceResolver = async (_: any, __: any, context: Context) => {
	const user = requireAuth(context);
	const contract = new ContractClient(context.env);

	try {
		// Get HITZ balance from contract (in stroops)
		const balanceInStroops = await contract.getHitzBalance(user.publicKey);
		
		// Convert stroops to HITZ (1 HITZ = 10^7 stroops)
		const balanceInHitz = Number(balanceInStroops) / 10_000_000;
		
		console.log(`💰 HITZ balance for ${user.publicKey}: ${balanceInHitz} HITZ`);
		
		return balanceInHitz;
	} catch (error) {
		console.error('❌ Error fetching HITZ balance:', error);
		// Return 0 if there's an error (user might not have any HITZ yet)
		return 0;
	}
};

