'use client'
import { View } from 'react-native'
import { ProfileHeader } from './ProfileHeader'
import Cog from 'app/ui/icons/cog'
import { CopyWalletPublicKeyButton } from 'app/ui/buttons/CopyWalletPublicKeyButton'
import { SafeAreaView } from 'app/design/safe-area-view'
import Like from 'app/ui/icons/like'
import StarBorder from 'app/ui/icons/star-border'
import { ProfileRow } from './profileRow'
import { Link, TextLink } from 'solito/link'
import TopUp from 'app/ui/icons/top-up'
import Send from 'app/ui/icons/send'
import { useRouter } from 'solito/navigation'
import { useState, useEffect, useRef } from 'react'
import { LowBalanceModal } from './LowBalanceModal'
import { SendXLMModal } from './SendXLMModal'
import { User } from 'app/api/graphql/types'
import {
  useUserCollectionQuery,
  useUserCreditsQuery,
  useUserLikesQuery,
  useClaimEarningsMutation,
} from 'app/api/graphql/mutations'
import { P, ActivityIndicator } from 'app/design/typography'
import { useToast } from 'app/provider/toast'
import { useTheme } from 'app/state/theme/useTheme'
import Stellar from 'app/ui/icons/stellar'

export function ProfileScreen({ user }: { user: User }) {
  const [lowBalanceModalVisible, setLowBalanceModalVisible] = useState<boolean>(false)
  const [sendModalVisible, setSendModalVisible] = useState<boolean>(false)
  const [isClaimingEarnings, setIsClaimingEarnings] = useState(false)
  const { data: credits, refetch: refetchUserCredits } = useUserCreditsQuery()
  const { push } = useRouter()
  const { data: userLikesData } = useUserLikesQuery()
  const { data: userCollectionData } = useUserCollectionQuery(user.id)
  const [claimEarnings] = useClaimEarningsMutation()
  const toast = useToast()
  const { theme, isDark } = useTheme()

  // Use a ref to track if we've already attempted to claim earnings
  const hasAttemptedClaim = useRef(false)

  // Attempt to claim earnings when the profile screen loads, but only once
  useEffect(() => {
    // Skip if we've already attempted
    if (hasAttemptedClaim.current) return

    const attemptClaimEarnings = async () => {
      // Mark that we've attempted to claim
      hasAttemptedClaim.current = true

      try {
        setIsClaimingEarnings(true)
        const earningsResult = await claimEarnings()
        const response = earningsResult.data?.claimEarnings

        if (response?.success) {
          if (response.totalClaimedAmount > 0) {
            // Refresh user credits to show updated balance
            try {
              await refetchUserCredits()
            } catch (refetchError) {
              console.error('Error refreshing user credits:', refetchError)
            }

            toast.show(
              `Successfully claimed ${response.totalClaimedAmount} XLM!`,
              { type: 'success' }
            )
          } else {
            // No earnings to claim
            toast.show(
              response.message || 'No earnings available to claim at this time',
              { type: 'info' }
            )
          }
        } else {
          // Claim failed with a specific message
          if (
            response?.message?.includes('24 hours') ||
            response?.lastClaimTime
          ) {
            // Don't show toast for cooldown period
          } else {
            // Generic error
            toast.show(response?.message || 'Failed to claim earnings', {
              type: 'danger',
            })
          }
        }
      } catch (error) {
        // Log error but don't show toast for network errors
        console.error('Failed to claim earnings:', error)
      } finally {
        setIsClaimingEarnings(false)
      }
    }

    attemptClaimEarnings()
  }, [claimEarnings, refetchUserCredits, toast])

  const handleWithdraw = () => {
    // Use hardcoded minimum withdrawal amount (5 XLM) as in the legacy app
    if (credits?.userCredits && credits.userCredits < 5) {
      setLowBalanceModalVisible(true)
    } else {
      setSendModalVisible(true)
    }
  }

  return (
    <SafeAreaView className="bg-[--bg-color]">
      <View className="mb-16 min-h-screen w-full pb-10">
        <ProfileHeader
          user={user}
          action={
            <View className="ml-2 flex flex-row">
              <Link href="/dashboard/profile/edit">
                <View className="items-center">
                  <Cog className="h-5 w-5" fill="var(--text-color)" />
                </View>
              </Link>
            </View>
          }
        />

        <View className="mt-1 w-full items-center justify-center">
          {user.publicKey && (
            <CopyWalletPublicKeyButton address={user.publicKey} />
          )}
        </View>

        <View className="mt-8 w-full items-center justify-center px-4">
          <View className="mb-0.5 flex w-full flex-row items-center justify-between">
            <View className="ml-2">
              {isClaimingEarnings ? (
                <ActivityIndicator size="small" />
              ) : (
                <P className="flex flex-row items-center font-bold font-unbounded text-[--text-color]">
                  <Stellar size={18} className="mr-2" />
                  {`${credits?.userCredits || 0} XLM`}
                </P>
              )}
            </View>
            <View className="mr-2">
              <P
                className="cursor-pointer flex flex-row items-center font-bold decoration-2 font-unbounded text-[--text-color]"
                onPress={handleWithdraw}
              >
                <Send size={18} className="text-blue mr-2" />
                Send
              </P>
            </View>
          </View>

          <View className="flex w-full flex-col">
            <TextLink href="/dashboard/profile/likes">
              <ProfileRow
                title="Likes"
                icon={
                  <Like className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                }
                count={userLikesData?.userLikes?.length || 0}
              />
            </TextLink>

            <TextLink href="/dashboard/profile/collection">
              <ProfileRow
                title="Collection"
                icon={
                  <StarBorder className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                }
                count={userCollectionData?.userEntries?.length || 0}
              />
            </TextLink>

            <TextLink href="/top-up">
              <ProfileRow
                title="Top-up"
                icon={
                  <TopUp className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                }
              />
            </TextLink>
          </View>
        </View>
      </View>

      <LowBalanceModal
        visible={lowBalanceModalVisible}
        onClose={() => setLowBalanceModalVisible(false)}
        minWithdrawalAmount={5}
      />
      
      <SendXLMModal
        visible={sendModalVisible}
        onClose={() => {
          setSendModalVisible(false);
          refetchUserCredits();
        }}
        currentBalance={credits?.userCredits || 0}
      />
    </SafeAreaView>
  )
}
