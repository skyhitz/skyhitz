import { GraphQLError } from 'graphql';
import { Context } from 'src/util/types';
import ContractClient from '../../contract';
import { requireAuth } from 'src/auth/auth-context';
import Encryption from 'src/util/encryption';

const MIN_HITZ_WITHDRAWAL = 1; // Minimum 1 HITZ

/**
 * Withdraw HITZ Resolver
 * 
 * Allows users to send HITZ tokens to external Stellar addresses.
 * This uses the Soroban token transfer functionality.
 */
export const withdrawHitzResolver = async (_: any, args: any, context: Context) => {
	const { address, amount } = args;
	const { env } = context;
	const user = requireAuth(context);
	const encryption = new Encryption(env);
	const contract = new ContractClient(env);

	console.log('💸 HITZ withdrawal request:', {
		user: user.publicKey,
		recipient: address,
		amount,
	});

	// Validate amount
	if (amount < MIN_HITZ_WITHDRAWAL) {
		throw new GraphQLError(`Minimum withdrawal amount is ${MIN_HITZ_WITHDRAWAL} HITZ`);
	}

	// Validate Stellar address format
	if (!address || address.length !== 56 || !address.startsWith('G')) {
		throw new GraphQLError('Invalid Stellar address format');
	}

	// Prevent self-transfers
	if (address === user.publicKey) {
		throw new GraphQLError('Cannot send HITZ to yourself');
	}

	try {
		// Get user's HITZ balance (convert from stroops)
		const balanceInStroops = await contract.getHitzBalance(user.publicKey);
		const balanceInHitz = Number(balanceInStroops) / 10_000_000;
		
		if (balanceInHitz < amount) {
			throw new GraphQLError(
				`Insufficient HITZ balance. You have ${balanceInHitz.toFixed(2)} HITZ, but tried to send ${amount.toFixed(2)} HITZ`
			);
		}

		// Decrypt user's secret key
		const userSecret = await encryption.decrypt(user.seed);

		// Transfer HITZ tokens
		const result = await contract.transferHitz(
			userSecret,
			address,
			amount
		);

		console.log('✅ HITZ withdrawal successful:', {
			amount,
			recipient: address,
			txHash: result?.txHash,
		});

		return {
			success: true,
			message: `Successfully sent ${amount.toFixed(2)} HITZ`,
			amount,
			txHash: result?.txHash || null,
		};

	} catch (error) {
		console.error('❌ HITZ withdrawal error:', error);
		
		// Handle specific error cases
		if (error instanceof GraphQLError) {
			throw error;
		}

		throw new GraphQLError(
			error instanceof Error 
				? error.message 
				: 'Failed to withdraw HITZ. Please try again.'
		);
	}
};
