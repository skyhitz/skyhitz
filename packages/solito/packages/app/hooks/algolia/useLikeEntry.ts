'use client'
import { Entry } from 'app/api/graphql/types'
import { useMutation } from '@apollo/client'
import { useMemo, useState } from 'react'
import { useUserStore } from 'app/state/user'
import { useToast } from 'app/provider/toast'
import { gql } from '@apollo/client'

// Define the LIKE_ENTRY mutation since it's not in the operations file
const LIKE_ENTRY = gql`
  mutation LikeEntry($id: String!) {
    likeEntry(id: $id) {
      id
      liked
    }
  }
`

export function useLikeEntry(entry: Entry) {
  const user = useUserStore((state) => state.user)
  const toast = useToast()
  const [likeEntryMutation, { loading: toggleLikeLoading }] = useMutation(LIKE_ENTRY)

  // Determine if the entry is liked by the current user
  // Since the Entry interface doesn't have likedByIds, we'll use a simple state
  // In a real implementation, this would come from the backend
  const [localIsLiked, setLocalIsLiked] = useState<boolean>(false)

  // Memoize the isLiked value to prevent unnecessary re-renders
  const isLiked = useMemo(() => localIsLiked, [localIsLiked])

  // Function to like/unlike an entry
  const likeEntry = async () => {
    if (!user) {
      toast.show('You need to be logged in to like this beat', { type: 'error' })
      return
    }

    try {
      // Optimistically update the UI
      setLocalIsLiked(!localIsLiked)

      const { data } = await likeEntryMutation({
        variables: {
          id: entry.id,
        },
      })

      if (!data?.likeEntry) {
        // Revert if the mutation fails
        setLocalIsLiked(localIsLiked)
        toast.show('Failed to update like status', { type: 'error' })
      }
    } catch (error) {
      // Revert on error
      setLocalIsLiked(localIsLiked)
      toast.show('Error liking entry', { type: 'error' })
      console.error('Error liking entry:', error)
    }
  }

  return { likeEntry, isLiked, toggleLikeLoading }
}
