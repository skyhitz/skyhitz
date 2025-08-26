'use client'
import { Entry } from 'app/api/graphql/types'
import { useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import { useUserStore } from 'app/state/user'
import { useToast } from 'app/provider/toast'
import { USER_LIKES, LIKE_ENTRY } from 'app/api/graphql/operations'

// Using LIKE_ENTRY imported from operations

export function useLikeEntry(entry: Entry) {
  const user = useUserStore((state) => state.user)
  const toast = useToast()
  const [likeEntryMutation, { loading: toggleLikeLoading }] =
    useMutation(LIKE_ENTRY)

  // Get the user's likes to determine if this entry is liked
  const {
    data: userLikesData,
    loading: likesLoading,
    refetch: refetchLikes,
  } = useQuery(USER_LIKES, {
    skip: !user,
    fetchPolicy: 'cache-and-network',
  })

  console.log('userLikesData', userLikesData)

  // State to track liked status when optimistically updating
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)

  // Check if the entry is in the user's likes
  const serverIsLiked = userLikesData?.userLikes
    ? userLikesData.userLikes.some(
        (likedEntry: Entry) => likedEntry.id === entry.id
      )
    : false

  // Use optimistic value if available, otherwise use server value
  const isLiked = optimisticLiked !== null ? optimisticLiked : serverIsLiked

  // Function to like/unlike an entry
  const likeEntry = async () => {
    if (!user) {
      toast.show('You need to be logged in to like this beat', {
        type: 'error',
      })
      return
    }

    // Store current like state before any changes
    const currentLikeState = isLiked

    try {
      // Optimistically update the UI
      setOptimisticLiked(!currentLikeState)

      // Execute the mutation
      const { data } = await likeEntryMutation({
        variables: {
          id: entry.id,
          like: !currentLikeState, // Pass the new like state
        },
      })

      // Refresh likes data after mutation
      refetchLikes()

      // Check if data exists. The response is a boolean now, not an object
      if (data?.likeEntry === undefined) {
        // Revert if the mutation fails
        setOptimisticLiked(currentLikeState)
        toast.show('Failed to update like status', { type: 'error' })
      }
    } catch (error) {
      console.error('Like error:', error)
      // Revert the optimistic update on error
      setOptimisticLiked(currentLikeState)
      toast.show('Error updating like status', { type: 'error' })
    }
  }

  return { likeEntry, isLiked, toggleLikeLoading }
}
