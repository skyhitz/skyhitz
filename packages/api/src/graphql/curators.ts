import { GraphQLError } from 'graphql';
import { requireAuth } from '../auth/auth-context';
import { AlgoliaClient } from '../algolia/algolia';
import { Context, Curator } from '../util/types';
import { ADMIN_ID } from '../constants/constants';
import Mailer from '../postmark/mailer';
import PasswordlessAuth from '../auth/passwordless';

/**
 * Check if a user is a curator (admin or in curators list)
 */
export async function checkIsCurator(algolia: AlgoliaClient, userId: string): Promise<boolean> {
  // Admin is always a curator
  if (userId === ADMIN_ID) {
    return true;
  }
  // Check if user is in curators list
  return await algolia.isCurator(userId);
}

/**
 * Query resolver to check if current user is a curator
 */
export const isCuratorResolver = async (
  _: any,
  __: any,
  ctx: Context
): Promise<boolean> => {
  const user = requireAuth(ctx);
  const algolia = new AlgoliaClient(ctx.env);
  return await checkIsCurator(algolia, user.id);
};

/**
 * Query resolver to get all curators (curator only)
 */
export const curatorsResolver = async (
  _: any,
  __: any,
  ctx: Context
): Promise<Curator[]> => {
  const user = requireAuth(ctx);
  const algolia = new AlgoliaClient(ctx.env);

  // Only curators can view curator list
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can view the curator list' },
    });
  }

  return await algolia.getAllCurators();
};

export interface AddCuratorInput {
  email: string;
}

/**
 * Mutation resolver to add a new curator
 * Only admin or existing curators can add new curators
 */
export const addCuratorResolver = async (
  _: any,
  { input }: { input: AddCuratorInput },
  ctx: Context
): Promise<{ success: boolean; message: string; curator?: Curator }> => {
  const user = requireAuth(ctx);
  const env = ctx.env;
  const algolia = new AlgoliaClient(env);
  const mailer = new Mailer(env);

  // Only curators can add new curators
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can add new curators' },
    });
  }

  const { email } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user exists by email
  const targetUser = await algolia.getUserByEmail(normalizedEmail);
  if (!targetUser) {
    throw new GraphQLError('USER_NOT_FOUND', {
      extensions: { code: 'USER_NOT_FOUND', message: `No user found with email: ${normalizedEmail}` },
    });
  }

  // Use id field for consistency with rest of codebase (fallback to objectID for Algolia compatibility)
  const userId = targetUser.id || targetUser.objectID;

  // Cannot add yourself
  if (userId === user.id) {
    throw new GraphQLError('INVALID_INPUT', {
      extensions: { code: 'INVALID_INPUT', message: 'You cannot add yourself as a curator' },
    });
  }

  // Check if already a curator
  const existingCurator = await algolia.getCurator(userId);
  if (existingCurator) {
    throw new GraphQLError('ALREADY_CURATOR', {
      extensions: { code: 'ALREADY_CURATOR', message: 'This user is already a curator' },
    });
  }

  // Admin is always a curator, no need to add
  if (userId === ADMIN_ID) {
    throw new GraphQLError('INVALID_INPUT', {
      extensions: { code: 'INVALID_INPUT', message: 'Admin is already a curator by default' },
    });
  }

  // Create curator record
  const curator: Curator = {
    objectID: userId,
    userId,
    userEmail: targetUser.email,
    userName: targetUser.displayName || targetUser.username,
    addedAt: new Date().toISOString(),
    addedAtTimestamp: Math.floor(Date.now() / 1000),
    addedBy: user.id,
    addedByName: user.displayName || user.username,
  };

  await algolia.saveCurator(curator);
  console.log(`✅ Added curator: ${targetUser.email} (by ${user.displayName || user.username})`);

  // Send email notification with magic login link
  try {
    // Generate a login token for the curator
    const passwordlessAuth = new PasswordlessAuth(env);
    const loginToken = passwordlessAuth.generateToken();
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
    await passwordlessAuth.storeOrUpdate(loginToken, userId, ttl, '');

    await mailer.sendCuratorAddedNotification({
      curatorEmail: targetUser.email,
      curatorName: targetUser.displayName || targetUser.username,
      curatorUserId: userId,
      addedByName: user.displayName || user.username,
      loginToken,
    });
    console.log(`✅ Sent curator notification email with login link to ${targetUser.email}`);
  } catch (error) {
    console.error('❌ Failed to send curator notification email:', error);
    // Don't fail the operation if email fails
  }

  return {
    success: true,
    message: `${targetUser.displayName || targetUser.username} is now a curator`,
    curator,
  };
};

export interface RemoveCuratorInput {
  email: string;
}

/**
 * Mutation resolver to remove a curator
 * Only admin or existing curators can remove curators
 * A curator cannot remove themselves unless they are admin
 */
export const removeCuratorResolver = async (
  _: any,
  { input }: { input: RemoveCuratorInput },
  ctx: Context
): Promise<{ success: boolean; message: string }> => {
  const user = requireAuth(ctx);
  const env = ctx.env;
  const algolia = new AlgoliaClient(env);
  const mailer = new Mailer(env);

  // Only curators can remove curators
  const isCurator = await checkIsCurator(algolia, user.id);
  if (!isCurator) {
    throw new GraphQLError('UNAUTHORIZED', {
      extensions: { code: 'UNAUTHORIZED', message: 'Only curators can remove curators' },
    });
  }

  const { email } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // Find curator by email
  const existingCurator = await algolia.getCuratorByEmail(normalizedEmail);
  if (!existingCurator) {
    throw new GraphQLError('NOT_FOUND', {
      extensions: { code: 'NOT_FOUND', message: `No curator found with email: ${normalizedEmail}` },
    });
  }

  const userId = existingCurator.userId;

  // Cannot remove admin
  if (userId === ADMIN_ID) {
    throw new GraphQLError('INVALID_INPUT', {
      extensions: { code: 'INVALID_INPUT', message: 'Cannot remove admin as curator' },
    });
  }

  // Non-admin curators cannot remove themselves
  if (userId === user.id && user.id !== ADMIN_ID) {
    throw new GraphQLError('INVALID_INPUT', {
      extensions: { code: 'INVALID_INPUT', message: 'You cannot remove yourself as a curator' },
    });
  }

  // Remove curator
  await algolia.deleteCurator(userId);
  console.log(`✅ Removed curator: ${existingCurator.userEmail} (by ${user.displayName || user.username})`);

  // Send email notification
  try {
    await mailer.sendCuratorRemovedNotification({
      curatorEmail: existingCurator.userEmail,
      curatorName: existingCurator.userName,
      removedByName: user.displayName || user.username,
    });
    console.log(`✅ Sent curator removal notification email to ${existingCurator.userEmail}`);
  } catch (error) {
    console.error('❌ Failed to send curator removal notification email:', error);
    // Don't fail the operation if email fails
  }

  return {
    success: true,
    message: `${existingCurator.userName} is no longer a curator`,
  };
};

