'use client'
import { Platform, View } from 'react-native'
import {
  ProfileHeader,
  SocialLinks,
} from 'app/features/dashboard/profile/ProfileHeader'
import Cog from 'app/ui/icons/cog'
import { CopyWalletPublicKeyButton } from 'app/ui/buttons/CopyWalletPublicKeyButton'
import { SafeAreaView } from 'app/design/safe-area-view'
import Like from 'app/ui/icons/like'
import StarBorder from 'app/ui/icons/star-border'
import { ProfileRow } from 'app/features/dashboard/profile/profileRow'
import { Link, TextLink } from 'solito/link'
import Dollar from 'app/ui/icons/dollar'
import { useRouter } from 'solito/navigation'
import { useState, useEffect, useRef } from 'react'
// SecureStorage no longer needed for cooldown
import { LowBalanceModal } from './LowBalanceModal'
import {
  User,
  useUserCollectionQuery,
  useUserCreditsQuery,
  useUserLikesQuery,
  useClaimEarningsMutation,
} from 'app/api/graphql'
import { Config } from 'app/config'
import { P, ActivityIndicator } from 'app/design/typography'
import { useToast } from 'app/provider/toast'
import { WithdrawCredits } from 'app/features/dashboard/profile/edit/WithdrawCredits'

export function ProfileScreen({ user }: { user: User }) {
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [isClaimingEarnings, setIsClaimingEarnings] = useState(false)
  const { data: credits, refetch: refetchUserCredits } = useUserCreditsQuery()
  const { push } = useRouter()
  const { data: userLikesData } = useUserLikesQuery()
  const { data: userCollectionData } = useUserCollectionQuery({
    variables: { userId: user.id },
  })
  const [claimEarnings] = useClaimEarningsMutation()
  const toast = useToast()

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
              { type: 'success' },
            )
          } else {
            // No earnings to claim
            toast.show(
              response.message || 'No earnings available to claim at this time',
              { type: 'info' },
            )
          }
        } else {
          // Claim failed with a specific message
          if (
            response?.message?.includes('24 hours') ||
            response?.lastClaimTime
          ) {
          } else {
            // Generic error
            toast.show(response?.message || 'Failed to claim earnings', {
              type: 'danger',
            })
          }
        }
      } catch (error) {
        console.error('Error claiming earnings:', error)
        toast.show('Error claiming earnings. Please try again later.', {
          type: 'danger',
        })
      } finally {
        setIsClaimingEarnings(false)
      }
    }

    attemptClaimEarnings()

    // Cleanup function to reset the ref when component unmounts
    return () => {
      hasAttemptedClaim.current = false
    }
  }, [refetchUserCredits])

  return (
    <SafeAreaView edges={['top']} className="w-full flex-1">
      <View className="flex flex-row items-center">
        <ProfileHeader
          avatar={user.avatarUrl}
          background={user.backgroundUrl!}
          displayName={user!.displayName!}
        />
      </View>
      <View className="ml-2 mt-8 flex">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <P className="font-unbounded my-4 mr-2.5 text-xl font-bold">
              {user.displayName}
            </P>
            <Link href="/dashboard/profile/edit">
              <Cog className="text-gray-600" size={18} />
            </Link>
          </View>
          <SocialLinks
            twitter={user!.twitter!}
            instagram={user.instagram!}
            profileUrl={`${Config.APP_URL}/dashboard/collector/${user.id}`}
          />
        </View>

        <View className="flex-row items-center">
          <Dollar size={22} className="text-gray-600" />
          <P className="ml-1 mr-2.5 font-bold">
            {credits?.userCredits.toFixed(2)}
          </P>
        </View>
        <View className="my-4">
          <CopyWalletPublicKeyButton walletPublicKey={user.publicKey} />
        </View>
      </View>

      <View className="mx-2 flex flex-col">
        <ProfileRow
          icon={<Like size={24} className="text-blue" />}
          trailingNumber={userLikesData?.userLikes?.length}
          title="Likes"
          onPress={() => push('/dashboard/profile/likes')}
        />
        <ProfileRow
          icon={<StarBorder size={24} className="text-blue" />}
          trailingNumber={userCollectionData?.userEntries?.length}
          title="Collection"
          onPress={() => push('/dashboard/profile/collection')}
        />
        {Platform.OS !== 'ios' && <WithdrawCredits />}
      </View>
      {isClaimingEarnings && (
        <View className="mx-auto mt-4 flex-row items-center justify-center">
          <ActivityIndicator size="small" />
          <P className="ml-2">Claiming earnings...</P>
        </View>
      )}
      <View className="bg-blue mx-auto mt-4 w-32 rounded-lg">
        <TextLink href={'/top-up'} className="flex items-center justify-center">
          <P className="tracking-0.5 flex items-center justify-center p-2 text-sm font-bold text-white">
            Top Up
          </P>
        </TextLink>
      </View>

      <LowBalanceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        availableBalance={credits?.userCredits ?? 0}
        publicKey={user.publicKey}
      />
    </SafeAreaView>
  )
}
