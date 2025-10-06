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
import { useState, useEffect, useRef } from 'react'
import { LowBalanceModal } from './LowBalanceModal'
import { SendXLMModal } from './SendXLMModal'
import { SendHITZModal } from './SendHITZModal'
import { User } from 'app/api/graphql/types'
import {
  useUserCollectionQuery,
  useUserCreditsQuery,
  useUserLikesQuery,
  useClaimEarningsMutation,
} from 'app/api/graphql/mutations'
import { useLazyQuery, useQuery } from '@apollo/client'
import { CLAIMABLE_EARNINGS_PREVIEW, USER_HITZ_BALANCE } from 'app/api/graphql/operations'
import { P, ActivityIndicator } from 'app/design/typography'
import { useToast } from 'app/provider/toast'
import Stellar from 'app/ui/icons/stellar'
import { AssetSelector } from 'app/ui/AssetSelector'
import { useAssetStore } from 'app/state/asset'
import { AssetType, ASSET_INFO } from 'app/types/asset'

const MIN_WITHDRAWAL_AMOUNT = 3

export function ProfileScreen({ user }: { user: User }) {
  const [lowBalanceModalVisible, setLowBalanceModalVisible] =
    useState<boolean>(false)
  const [sendXlmModalVisible, setSendXlmModalVisible] = useState<boolean>(false)
  const [sendHitzModalVisible, setSendHitzModalVisible] = useState<boolean>(false)
  const [isClaimingEarnings, setIsClaimingEarnings] = useState(false)
  const { data: credits, refetch: refetchUserCredits } = useUserCreditsQuery()
  const { data: hitzBalanceData, refetch: refetchHitzBalance } = useQuery(USER_HITZ_BALANCE, { skip: !user })
  const { data: userLikesData } = useUserLikesQuery()
  const { data: userCollectionData } = useUserCollectionQuery(user.id)
  const [claimEarnings] = useClaimEarningsMutation()
  const [loadPreview] = useLazyQuery(CLAIMABLE_EARNINGS_PREVIEW)
  const toast = useToast()
  const { selectedAsset } = useAssetStore()

  // Use a ref to track if we've already attempted to claim earnings
  const hasAttemptedClaim = useRef(false)
  
  // Get balance based on selected asset
  const displayBalance = selectedAsset === AssetType.XLM 
    ? (credits?.userCredits || 0)
    : (hitzBalanceData?.userHitzBalance || 0)
  
  const assetInfo = ASSET_INFO[selectedAsset]

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
    if (selectedAsset === AssetType.XLM) {
      // XLM withdrawal
      if (credits?.userCredits && credits.userCredits < MIN_WITHDRAWAL_AMOUNT) {
        setLowBalanceModalVisible(true)
      } else {
        setSendXlmModalVisible(true)
      }
    } else {
      // HITZ withdrawal
      setSendHitzModalVisible(true)
    }
  }

  return (
    <SafeAreaView className="bg-[--bg-color]">
      <View className="mb-16 min-h-screen w-full pb-10">
        <ProfileHeader
          user={user}
          action={
            <View className="ml-2 flex flex-row">
              <Link href="/profile/edit">
                <View className="items-center">
                  <Cog className="h-5 w-5" fill="var(--text-color)" />
                </View>
              </Link>
            </View>
          }
        />

        <View className="mt-8 w-full items-center justify-center px-4">
          {/* Asset Selector */}
          <View className="mb-4 w-full flex-row items-center justify-center">
            <AssetSelector />
          </View>

          {/* Balance Display */}
          <View className="mb-0.5 flex w-full flex-row items-center justify-between">
            <View className="ml-2 flex flex-row items-center gap-2">
              <P className="flex flex-row items-center font-bold font-unbounded text-[--text-color] gap-2">
                {selectedAsset === AssetType.XLM ? (
                  <Stellar size={18} />
                ) : (
                  <View className="h-[18px] w-[18px] rounded-full bg-gradient-to-r from-[--primary-color] to-[--accent-color]" />
                )}
                {`${displayBalance.toFixed(2)} ${assetInfo.ticker}`}
              </P>

              {isClaimingEarnings ? (
                <ActivityIndicator size="small" />
              ) : null}
            </View>
            {/* Send button for both XLM and HITZ */}
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
          <View className="my-4 w-full items-start justify-center">
            {user.publicKey && (
              <CopyWalletPublicKeyButton walletPublicKey={user.publicKey} />
            )}
          </View>

          <View className="flex w-full flex-col">
            <TextLink href="/profile/likes">
              <ProfileRow
                title="Likes"
                icon={
                  <Like className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                }
                count={userLikesData?.userLikes?.length || 0}
              />
            </TextLink>

            <TextLink href="/profile/collection">
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
        minWithdrawalAmount={MIN_WITHDRAWAL_AMOUNT}
      />

      <SendXLMModal
        visible={sendXlmModalVisible}
        onClose={() => {
          setSendXlmModalVisible(false)
          refetchUserCredits()
        }}
        currentBalance={credits?.userCredits || 0}
      />

      <SendHITZModal
        visible={sendHitzModalVisible}
        onClose={() => {
          setSendHitzModalVisible(false)
          // Refetch HITZ balance after sending
          refetchHitzBalance()
        }}
        currentBalance={displayBalance}
      />
    </SafeAreaView>
  )
}
