'use client'
import { ProfileHeader } from './ProfileHeader'
import Cog from 'app/ui/icons/cog'
import { CopyWalletPublicKeyButton } from 'app/ui/buttons/CopyWalletPublicKeyButton'
import { SafeAreaView } from 'app/design/safe-area-view'
import Like from 'app/ui/icons/like'
import StarBorder from 'app/ui/icons/star-border'
import { ProfileRow } from './profileRow'
import { Link, TextLink } from 'app/navigation'
import TopUp from 'app/ui/icons/top-up'
import Send from 'app/ui/icons/send'
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
import { useLazyQuery } from '@apollo/client'
import { CLAIMABLE_EARNINGS_PREVIEW } from 'app/api/graphql/operations'
import { P, ActivityIndicator } from 'app/design/typography'
import { useToast } from 'app/provider/toast'
import Stellar from 'app/ui/icons/stellar'
import { YStack, XStack, Button } from 'tamagui'

const MIN_WITHDRAWAL_AMOUNT = 3

export function ProfileScreen({ user }: { user: User }) {
  const [lowBalanceModalVisible, setLowBalanceModalVisible] =
    useState<boolean>(false)
  const [sendModalVisible, setSendModalVisible] = useState<boolean>(false)
  const [isClaimingEarnings, setIsClaimingEarnings] = useState(false)
  const { data: credits, refetch: refetchUserCredits } = useUserCreditsQuery()
  const { data: userLikesData } = useUserLikesQuery()
  const { data: userCollectionData } = useUserCollectionQuery(user.id)
  const [claimEarnings] = useClaimEarningsMutation()
  const [loadPreview] = useLazyQuery(CLAIMABLE_EARNINGS_PREVIEW)
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
        // Preview first; skip invoking if nothing to claim
        const preview = await loadPreview()
        const previewAmt = Number(preview?.data?.claimableEarningsPreview?.totalClaimedAmount || 0)
        if (!previewAmt || previewAmt <= 0) {
          setIsClaimingEarnings(false)
          return
        }

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
    if (credits?.userCredits && credits.userCredits < MIN_WITHDRAWAL_AMOUNT) {
      setLowBalanceModalVisible(true)
    } else {
      setSendModalVisible(true)
    }
  }

  return (
    <SafeAreaView backgroundColor="$background">
      <YStack marginBottom="$16" minHeight="100vh" width="100%" paddingBottom="$10">
        <ProfileHeader
          user={user}
          action={
            <XStack marginLeft="$2" flexDirection="row">
              <Link href="/profile/edit">
                <YStack alignItems="center">
                  <Cog width={20} height={20} fill="$color12" />
                </YStack>
              </Link>
            </XStack>
          }
        />

        <YStack marginTop="$8" width="100%" alignItems="center" justifyContent="center" paddingHorizontal="$4">
          <XStack marginBottom="$1" flex={1} width="100%" flexDirection="row" alignItems="center" justifyContent="space-between">
            <XStack marginLeft="$2" flexDirection="row" alignItems="center" gap="$2">
                <P
                  flexDirection="row"
                  alignItems="center"
                  fontWeight="bold"
                  fontFamily="$heading"
                  color="$color12"
                  gap="$2"
                >
                  <Stellar size={18} />
                  {`${credits?.userCredits || 0} XLM`}
                </P>

              {isClaimingEarnings ? (
                <ActivityIndicator size="small" />
              ) : null}
            </XStack>
            <XStack marginRight="$2">
              <Button
                backgroundColor="transparent"
                padding="$0"
                flexDirection="row"
                alignItems="center"
                fontWeight="bold"
                fontFamily="$heading"
                color="$color12"
                onPress={handleWithdraw}
              >
                <Send size={18} color="$blue9" marginRight="$2" />
                <P>Send</P>
              </Button>
            </XStack>
          </XStack>
          <YStack marginVertical="$4" width="100%" alignItems="flex-start" justifyContent="center">
            {user.publicKey && (
              <CopyWalletPublicKeyButton walletPublicKey={user.publicKey} />
            )}
          </YStack>

          <YStack flex={1} width="100%" flexDirection="column">
            <TextLink href="/profile/likes">
              <ProfileRow
                title="Likes"
                icon={
                  <Like width={20} height={20} fill="none" stroke="$color12" strokeWidth={2} />
                }
                count={userLikesData?.userLikes?.length || 0}
              />
            </TextLink>

            <TextLink href="/profile/collection">
              <ProfileRow
                title="Collection"
                icon={
                  <StarBorder width={20} height={20} fill="none" stroke="$color12" strokeWidth={2} />
                }
                count={userCollectionData?.userEntries?.length || 0}
              />
            </TextLink>

            <TextLink href="/top-up">
              <ProfileRow
                title="Top-up"
                icon={
                  <TopUp width={20} height={20} fill="none" stroke="$color12" strokeWidth={2} />
                }
              />
            </TextLink>
          </YStack>
        </YStack>
      </YStack>

      <LowBalanceModal
        visible={lowBalanceModalVisible}
        onClose={() => setLowBalanceModalVisible(false)}
        minWithdrawalAmount={MIN_WITHDRAWAL_AMOUNT}
      />

      <SendXLMModal
        visible={sendModalVisible}
        onClose={() => {
          setSendModalVisible(false)
          refetchUserCredits()
        }}
        currentBalance={credits?.userCredits || 0}
      />
    </SafeAreaView>
  )
}
