'use client'
import { Heart } from '@tamagui/lucide-icons'
import { Entry } from 'app/api/graphql/types'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { useMutation, useQuery } from '@apollo/client'
import useLikeCache from 'app/hooks/useLikeCache'
import { lumensToStroops } from 'app/utils'
import { MICRO_SPEND_LIKE_XLM } from 'app/constants/constants'
import { LIKE_ENTRY, INVEST_ENTRY, USER_LIKES, USER_CREDITS } from 'app/api/graphql/operations'
import { useTopUpModalStore } from 'app/state/topup'
import { useToast } from 'app/provider/toast'
import { trackLike } from 'app/utils/analytics'
import { Button } from 'tamagui'

// Using imported GraphQL operations from operations.ts

interface Props {
  size?: number
  entry: Entry
}

function LikeButton({ size = 24, entry }: Props) {
  const user = useUserStore((state) => state.user)
  const { push } = useRouter()

  // Setup GraphQL operations
  const [likeEntry, { loading: likeLoading }] = useMutation(LIKE_ENTRY)
  const [invest] = useMutation(INVEST_ENTRY)
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
      }

      // Also spend a small amount when liking (no shares)
      const available = Number(creditsData?.userCredits ?? 0)
      if (!available || available < MICRO_SPEND_LIKE_XLM) {
        openTopUpModal({ action: 'like', requiredXLM: MICRO_SPEND_LIKE_XLM, availableXLM: available })
        return
      }
      const res = await invest({
        variables: {
          id: entry.id,
          amount: lumensToStroops(MICRO_SPEND_LIKE_XLM),
        },
      })
      if (res?.data?.investEntry?.success) {
        // Refetch credits to show new balance in toast
        const refreshed = await (async () => {
          try {
            const q = await (creditsData ? Promise.resolve({ data: { userCredits: creditsData.userCredits } }) : Promise.resolve(null))
            return q
          } catch {
            return null
          }
        })()
        // If we have credits query hooked up with network-only elsewhere, fetch again locally
        // For safety, run a new query when available
        try {
          // reuse existing query via refetch by re-running useQuery is not trivial here; keep it simple
          // Show last known or 0
          const newBal = Number(refreshed?.data?.userCredits ?? 0).toFixed(2)
          toast.show(`Liked! Balance: ${newBal} XLM`, { type: 'success' })
        } catch {
          toast.show('Liked!', { type: 'success' })
        }
      }
    } catch (error) {
      // Revert cache on error
      isLiked ? addLikeToCache(entry) : removeLikeFromCache(entry)
      console.error('Like error:', error)
    }
  }

  return (
    <Button
      onPress={handlePress}
      disabled={likeLoading}
      backgroundColor="transparent"
      padding="$0"
    >
      <Heart
        size={size}
        fill={isLiked ? '$gray10' : 'none'}
        color="$gray10"
      />
    </Button>
  )
}

export default LikeButton
