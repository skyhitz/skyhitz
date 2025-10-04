import { GraphQLError } from 'graphql';
import { Context } from 'src/util/types';
import ContractClient from '../contract';
import { requireAuth } from 'src/auth/auth-context';
import Encryption from 'src/util/encryption';
import { AlgoliaClient } from 'src/algolia/algolia';

/**
 * Record Action Resolver - NEW CONTRACT INTERFACE
 * 
 * Records user actions on entries: stream, like, download
 * Charges a small XLM fee and tracks engagement
 * 
 * Actions:
 * - stream: User plays a track (called on playback completion)
 * - like: User likes a track
 * - download: User downloads a track
 */
export const recordActionResolver = async (_: any, args: any, context: Context) => {
    const { id, action } = args;
    const { env } = context;
    const user = requireAuth(context);
    const encryption = new Encryption(env);
    const contract = new ContractClient(env);
    const algolia = new AlgoliaClient(env);

    console.log(`🎬 Record action resolver - Entry: ${id}, Action: ${action}`);

    // Validate action type
    const validActions = ['stream', 'like', 'download'];
    if (!validActions.includes(action)) {
        throw new GraphQLError(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
    }

    try {
        // 1. Call the NEW recordAction function in the contract
        const result = await contract.recordAction(
            await encryption.decrypt(user.seed),
            id,
            action
        );

        console.log('✅ Record action result:', result?.status, 'Fee:', result?.fee);

        // 2. Get updated entry data from contract
        const sorobanEntry = await contract.getEntry(id);
        const stats = await contract.getEntryStats(id);

        console.log('📈 Entry stats after action:', {
            escrow: sorobanEntry.escrow_xlm,
            apr: stats.apr,
        });

        // 3. Update Algolia search index with new escrow data
        try {
            await algolia.partialUpdateEntry({
                escrow: Number(sorobanEntry.escrow_xlm) / 10_000_000,
                apr: Number(stats.apr) / 100,
                objectID: id,
            });
            console.log('✅ Algolia updated successfully');
        } catch (e) {
            console.error('❌ Algolia update failed:', e);
        }

        // 4. Return success response
        return {
            success: result?.status === 'SUCCESS',
            message: `${action} recorded successfully`,
            fee: Number(result?.fee || 0) / 10_000_000, // Convert stroops to XLM
        };

    } catch (error) {
        console.error('❌ Record action resolver error:', error);
        throw new GraphQLError(
            error instanceof Error ? error.message : 'Failed to record action'
        );
    }
};

