'use client'
import { Pressable } from 'react-native'
import Like from 'app/ui/icons/like'
import { Entry } from 'app/api/graphql/types'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { useMutation, useQuery } from '@apollo/client'
import useLikeCache from 'app/hooks/useLikeCache'
import { MICRO_SPEND_LIKE_XLM } from 'app/constants/constants'
import { LIKE_ENTRY, RECORD_ACTION, USER_LIKES, USER_CREDITS } from 'app/api/graphql/operations'
import { useTopUpModalStore } from 'app/state/topup'
import { useToast } from 'app/provider/toast'
import { trackLike } from 'app/utils/analytics'
import { isExternalPreview } from 'app/utils/external-entry'

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
  const [recordAction] = useMutation(RECORD_ACTION)
  const { data: creditsData } = useQuery(USER_CREDITS, { skip: !user, fetchPolicy: 'network-only' })
  const openTopUpModal = useTopUpModalStore((s) => s.openTopUpModal)
  const { data: userLikesData } = useQuery(USER_LIKES, { skip: !user })
  const toast = useToast()

  // Get cache manipulation helpers
  const { addLikeToCache, removeLikeFromCache } = useLikeCache()

  // Check if this entry is in the user's likes
  const isLiked = userLikesData?.userLikes
    ? userLikesData.userLikes.some((item: Entry) => item.id === entry.id)
    : false

  // Handle press event
  const handlePress = async () => {
    if (!user) return push('/sign-in')

    // Disable liking for external preview entries
    if (isExternalPreview(entry.id)) {
      console.log('[LikeButton] Like disabled for external preview:', entry.id)
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

      // Track like event only when actually liking (not unliking)
      if (!isLiked) {
        trackLike(entry.id, entry.title, entry.artist)
        
        // Record like action (charges fee automatically)
        const available = Number(creditsData?.userCredits ?? 0)
        if (!available || available < MICRO_SPEND_LIKE_XLM) {
          openTopUpModal({ action: 'like', requiredXLM: MICRO_SPEND_LIKE_XLM, availableXLM: available })
          return
        }
        
        try {
          const res = await recordAction({
            variables: {
              id: entry.id,
              action: 'like',
            },
          })
          
          if (res?.data?.recordAction?.success) {
            const fee = res.data.recordAction.fee
            toast.show(`Liked! Fee: ${fee.toFixed(4)} XLM`, { type: 'success' })
          }
        } catch (error) {
          console.error('Failed to record like action:', error)
          toast.show('Like recorded locally', { type: 'info' })
        }
      } else {
        // Just unliking, no fee
        toast.show('Unliked', { type: 'info' })
      }
    } catch (error) {
      // Revert cache on error
      isLiked ? addLikeToCache(entry) : removeLikeFromCache(entry)
      console.error('Like error:', error)
    }
  }

  // Hide like button for external previews
  if (isExternalPreview(entry.id)) {
    return null
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
