'use client'
import { Pressable } from 'react-native'
import Like from 'app/ui/icons/like'
import { Entry } from 'app/api/graphql/types'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { useMutation, useQuery } from '@apollo/client'
import useLikeCache from 'app/hooks/useLikeCache'
import { lumensToStroops } from 'app/utils'
import { MICRO_SPEND_LIKE_XLM } from 'app/constants/constants'
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
  const { push } = useRouter()

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
    if (!user) return push('/sign-in')

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

      // Also spend a small amount when liking (no shares)
      await invest({
        variables: {
          id: entry.id,
          amount: lumensToStroops(MICRO_SPEND_LIKE_XLM),
        },
      })
    } catch (error) {
      // Revert cache on error
      isLiked ? addLikeToCache(entry) : removeLikeFromCache(entry)
      console.error('Like error:', error)
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
