'use client'
import { Platform, View } from 'react-native'
import { ProfileHeader } from './ProfileHeader'
import Cog from 'app/ui/icons/cog'
import { CopyWalletPublicKeyButton } from 'app/ui/buttons/CopyWalletPublicKeyButton'
import { SafeAreaView } from 'app/design/safe-area-view'
import Like from 'app/ui/icons/like'
import StarBorder from 'app/ui/icons/star-border'
import { ProfileRow } from './profileRow'
import { Link, TextLink } from 'solito/link'
import Dollar from 'app/ui/icons/dollar'
import { useRouter } from 'solito/navigation'
import { useState, useEffect, useRef } from 'react'
import { LowBalanceModal } from './LowBalanceModal'
import {
  User,
  useUserCollectionQuery,
  useUserCreditsQuery,
  useUserLikesQuery,
  useClaimEarningsMutation,
} from 'app/api/graphql/mutations'
import { Config } from 'app/config'
import { P, ActivityIndicator } from 'app/design/typography'
import { useToast } from 'app/provider/toast'
import { WithdrawCredits } from './edit/WithdrawCredits'

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
      try {
        setIsClaimingEarnings(true)
        await claimEarnings()
        // Refresh user credits after claiming
        refetchUserCredits()
      } catch (error) {
        // Silent failure is ok here
        console.error('Failed to claim earnings:', error)
      } finally {
        setIsClaimingEarnings(false)
        // Mark that we've attempted to claim
        hasAttemptedClaim.current = true
      }
    }

    attemptClaimEarnings()
  }, [claimEarnings, refetchUserCredits])

  const handleWithdraw = () => {
    if (credits?.userCredits && credits.userCredits < Config.MINIMUM_WITHDRAWAL_AMOUNT) {
      setModalVisible(true)
    } else {
      push('/dashboard/profile/edit?withdraw=true')
    }
  }

  return (
    <SafeAreaView className="bg-black">
      <View className="mb-16 min-h-screen w-full bg-black pb-10">
        <ProfileHeader
          user={user}
          action={
            <View className="ml-2 flex flex-row">
              <Link href="/dashboard/profile/edit">
                <View className="items-center">
                  <Cog className="h-5 w-5 fill-white" />
                </View>
              </Link>
            </View>
          }
        />

        <View className="mt-1 w-full items-center justify-center">
          {user.publicKey && <CopyWalletPublicKeyButton address={user.publicKey} />}
        </View>

        <View className="mt-8 w-full items-center justify-center px-4">
          <View className="mb-0.5 flex w-full max-w-lg flex-row items-center justify-between">
            <P className="ml-2 font-bold text-white">
              {isClaimingEarnings ? (
                <ActivityIndicator size="small" />
              ) : (
                `${credits?.userCredits || 0} XLM`
              )}
            </P>
            <P
              className="mr-2 cursor-pointer font-bold text-white underline decoration-white decoration-2 underline-offset-4"
              onPress={handleWithdraw}
            >
              Withdraw
            </P>
          </View>

          <View className="flex w-full max-w-lg flex-col">
            <TextLink href="/dashboard/profile/likes">
              <ProfileRow
                title="Likes"
                icon={<Like className="h-5 w-5 fill-none stroke-current stroke-2 text-white" />}
                count={userLikesData?.userLikes?.length || 0}
              />
            </TextLink>

            <TextLink href="/dashboard/profile/collection">
              <ProfileRow
                title="Collection"
                icon={<StarBorder className="h-5 w-5 fill-none stroke-current stroke-2 text-white" />}
                count={userCollectionData?.userEntries?.length || 0}
              />
            </TextLink>

            <TextLink href="/top-up">
              <ProfileRow
                title="Top-up"
                icon={<Dollar className="h-5 w-5 fill-none stroke-current stroke-2 text-white" />}
              />
            </TextLink>
          </View>
        </View>
      </View>

      <LowBalanceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        minWithdrawalAmount={Config.MINIMUM_WITHDRAWAL_AMOUNT}
      />
    </SafeAreaView>
  )
}
