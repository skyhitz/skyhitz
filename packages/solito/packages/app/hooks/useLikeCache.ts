'use client'
import { ApolloCache, useApolloClient } from '@apollo/client'
import { Entry } from 'app/api/graphql/types'
import { useCallback } from 'react'
import { useUserStore } from 'app/state/user'
import { USER_LIKES, ENTRY_LIKES } from 'app/api/graphql/operations'

// Use the imported operations for cache manipulation
const USER_LIKES_DOCUMENT = USER_LIKES
const ENTRY_LIKES_DOCUMENT = ENTRY_LIKES

// Type for public user information
interface PublicUser {
  __typename: string
  id: string
  username: string
  displayName?: string
  avatarUrl: string
  description?: string
}

/**
 * Hook to handle like cache manipulation
 */
export default function useLikeCache() {
  const user = useUserStore((state) => state.user)
  const { cache } = useApolloClient()
  const publicUser = userToPublicUser(user)

  const addLikeToCache = useCallback(
    (entry: Entry) => addLike(cache, publicUser, entry),
    [cache, publicUser]
  )
  
  const removeLikeFromCache = useCallback(
    (entry: Entry) => removeLike(cache, publicUser, entry),
    [cache, publicUser]
  )

  return { addLikeToCache, removeLikeFromCache }
}

/**
 * Convert full user to public user
 */
function userToPublicUser(user: any | null): PublicUser | null {
  if (!user) return null
  return {
    __typename: 'PublicUser',
    avatarUrl: user.avatarUrl || '',
    description: user.description,
    displayName: user.displayName,
    id: user.id,
    username: user.username,
  }
}

/**
 * Add like to Apollo cache
 */
function addLike(
  cache: ApolloCache<unknown>,
  user: PublicUser | null,
  entry: Entry
) {
  if (!user) return

  // Update user likes cache
  cache.updateQuery(
    { query: USER_LIKES_DOCUMENT, overwrite: true },
    (data: any) => {
      const currentLikes = data?.userLikes || []
      // Only add if not already in the list
      if (!currentLikes.some((item: Entry) => item.id === entry.id)) {
        return {
          userLikes: [entry, ...currentLikes],
        }
      }
      return data
    }
  )

  // Update entry likes cache
  cache.updateQuery(
    { 
      query: ENTRY_LIKES_DOCUMENT, 
      variables: { id: entry.id }, 
      overwrite: true 
    },
    (data: any) => {
      const currentUsers = data?.entryLikes?.users || []
      // Only add if not already in the list
      if (!currentUsers.some((item: PublicUser) => item.id === user.id)) {
        return {
          entryLikes: {
            __typename: 'EntryLikes',
            users: [user, ...currentUsers],
          },
        }
      }
      return data
    }
  )
}

/**
 * Remove like from Apollo cache
 */
function removeLike(
  cache: ApolloCache<unknown>,
  user: PublicUser | null,
  entry: Entry
) {
  if (!user) return

  // Update user likes cache
  cache.updateQuery(
    { query: USER_LIKES_DOCUMENT, overwrite: true },
    (data: any) => {
      const currentLikes = data?.userLikes || []
      return {
        userLikes: currentLikes.filter((item: Entry) => item.id !== entry.id),
      }
    }
  )

  // Update entry likes cache
  cache.updateQuery(
    { 
      query: ENTRY_LIKES_DOCUMENT, 
      variables: { id: entry.id }, 
      overwrite: true 
    },
    (data: any) => {
      const currentUsers = data?.entryLikes?.users || []
      return {
        entryLikes: {
          __typename: 'EntryLikes',
          users: currentUsers.filter((item: PublicUser) => item.id !== user.id),
        },
      }
    }
  )
}
