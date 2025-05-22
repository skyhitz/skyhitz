'use client'
import { Pressable } from 'react-native'
import Like from 'app/ui/icons/like'
import { Entry } from 'app/api/graphql/types'
import { useUserStore } from 'app/state/user'
import { useToast } from 'app/provider/toast'
import { useMutation, useQuery } from '@apollo/client'
import useLikeCache from 'app/hooks/useLikeCache'
import { lumensToStroops } from 'app/utils'
import {
  LIKE_ENTRY,
  INVEST_ENTRY,
  USER_LIKES,
} from 'app/api/graphql/operations'

// Using imported GraphQL operations from operations.ts

interface Props {
  size?: number
  className?: string
  entry: Entry
}

function LikeButton({ size = 24, className, entry }: Props) {
  const user = useUserStore((state) => state.user)
  const toast = useToast()

  // Setup GraphQL operations
  const [likeEntry, { loading: likeLoading }] = useMutation(LIKE_ENTRY)
  const [invest] = useMutation(INVEST_ENTRY)
  const { data: userLikesData } = useQuery(USER_LIKES, { skip: !user })

  // Get cache manipulation helpers
  const { addLikeToCache, removeLikeFromCache } = useLikeCache()

  // Check if this entry is in the user's likes
  const isLiked = userLikesData?.userLikes
    ? userLikesData.userLikes.some((item: Entry) => item.id === entry.id)
    : false

  // Handle press event
  const handlePress = async () => {
    if (!user) {
      toast.show('You need to be logged in to like this beat', {
        type: 'error',
      })
      return
    }

    // Optimistically update the UI through cache manipulation
    isLiked ? removeLikeFromCache(entry) : addLikeToCache(entry)

    try {
      // Execute the API call
      const { data } = await likeEntry({
        variables: {
          id: entry.id,
          like: !isLiked, // Pass the new like state
        },
      })

      // Also invest a small amount when liking (like in the legacy app)
      await invest({
        variables: {
          id: entry.id,
          amount: lumensToStroops(0.2),
        },
      })
    } catch (error) {
      // Revert cache on error
      isLiked ? addLikeToCache(entry) : removeLikeFromCache(entry)
      console.error('Like error:', error)
      toast.show('Error updating like status', { type: 'error' })
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={likeLoading}
      className={className}
    >
      <Like
        width={size}
        height={size}
        className={`${
          isLiked ? 'fill-[--text-secondary-color]' : ''
        } stroke-[--text-secondary-color]`}
      />
    </Pressable>
  )
}

export default LikeButton
