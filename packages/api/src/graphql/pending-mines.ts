import { GraphQLError } from 'graphql';
import { requireAuth } from 'src/auth/auth-context';
import { AlgoliaClient } from 'src/algolia/algolia';
import { Context, PendingMine } from 'src/util/types';
import { ADMIN_ID } from 'src/constants/constants';

/**
 * Query resolver to get all pending mines (admin only)
 */
export const pendingMinesResolver = async (_: any, __: any, ctx: Context): Promise<PendingMine[]> => {
  const user = requireAuth(ctx);
  
  // Only admin can view pending mines
  if (user.id !== ADMIN_ID) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only admins can view pending mines' },
    });
  }

  const algolia = new AlgoliaClient(ctx.env);
  return await algolia.getAllPendingMines();
};

/**
 * Query resolver to get a specific pending mine (admin only)
 */
export const pendingMineResolver = async (_: any, { id }: { id: string }, ctx: Context): Promise<PendingMine> => {
  const user = requireAuth(ctx);
  
  // Only admin can view pending mines
  if (user.id !== ADMIN_ID) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only admins can view pending mines' },
    });
  }

  const algolia = new AlgoliaClient(ctx.env);
  
  try {
    const pendingMine = await algolia.getPendingMine(id);
    return {
      ...pendingMine,
      id: pendingMine.objectID,
    } as PendingMine;
  } catch (error) {
    throw new GraphQLError('NOT_FOUND', {
      extensions: { code: 'NOT_FOUND', message: 'Pending mine not found' },
    });
  }
};

/**
 * Mutation resolver to reject a pending mine (admin only)
 */
export const rejectPendingMineResolver = async (_: any, { id }: { id: string }, ctx: Context): Promise<boolean> => {
  const user = requireAuth(ctx);
  
  // Only admin can reject pending mines
  if (user.id !== ADMIN_ID) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only admins can reject pending mines' },
    });
  }

  const algolia = new AlgoliaClient(ctx.env);
  
  try {
    await algolia.updatePendingMineStatus(id, 'rejected', user.id);
    return true;
  } catch (error) {
    console.error('Failed to reject pending mine:', error);
    throw new GraphQLError('OPERATION_FAILED', {
      extensions: { code: 'OPERATION_FAILED', message: 'Failed to reject pending mine' },
    });
  }
};

