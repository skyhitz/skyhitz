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
import Upload from 'app/ui/icons/upload'
import { useState, useEffect, useRef } from 'react'
import { LowBalanceModal } from './LowBalanceModal'
import { WithdrawModal } from './WithdrawModal'
import { User } from 'app/api/graphql/types'
import {
  useUserCollectionQuery,
  useUserCreditsQuery,
  useUserLikesQuery,
  useClaimEarningsMutation,
  usePendingUploadsCountQuery,
  useIsCuratorQuery,
} from 'app/api/graphql/mutations'
import { useLazyQuery, useQuery } from '@apollo/client'
import { CLAIMABLE_EARNINGS_PREVIEW, USER_HITZ_BALANCE, XLM_PRICE, HITZ_PRICE_XLM } from 'app/api/graphql/operations'
import { P, ActivityIndicator } from 'app/design/typography'
import { useToast } from 'app/provider/toast'
import Stellar from 'app/ui/icons/stellar'
import Lock from 'app/ui/icons/lock'
import { useAssetStore } from 'app/state/asset'
import Users from 'app/ui/icons/users'
import { AssetType, stroopsToToken } from 'app/types/asset'
import { sharesIndex } from 'app/api/algolia'
import { SkyhitzLogo } from 'app/ui/logo'
const MIN_WITHDRAWAL_AMOUNT = 1

export function ProfileScreen({ user }: { user: User }) {
  const [lowBalanceModalVisible, setLowBalanceModalVisible] =
    useState<boolean>(false)
  const [withdrawVisible, setWithdrawVisible] = useState<boolean>(false)
  const [isClaimingEarnings, setIsClaimingEarnings] = useState(false)
  const { data: credits, refetch: refetchUserCredits } = useUserCreditsQuery()
  const { data: hitzBalanceData, refetch: refetchHitzBalance } = useQuery(USER_HITZ_BALANCE, { skip: !user })
  const { data: priceData } = useQuery(XLM_PRICE)
  const { data: hitzPriceData } = useQuery(HITZ_PRICE_XLM)
  const { data: userLikesData } = useUserLikesQuery()
  const { data: userCollectionData } = useUserCollectionQuery(user.id)
  const { data: pendingUploadsCountData } = usePendingUploadsCountQuery()
  const { data: isCuratorData } = useIsCuratorQuery()
  const isCurator = isCuratorData?.isCurator === true
  const [claimEarnings] = useClaimEarningsMutation()
  const [loadPreview] = useLazyQuery(CLAIMABLE_EARNINGS_PREVIEW)
  const toast = useToast()
  const { selectedAsset } = useAssetStore()
  const [totalStakedStroops, setTotalStakedStroops] = useState(0)

  // Use a ref to track if we've already attempted to claim earnings
  const hasAttemptedClaim = useRef(false)

  // Fetch user's total staked shares across all entries
  useEffect(() => {
    const fetchTotalStake = async () => {
      try {
        const res = await sharesIndex.search('', {
          filters: `userId:${user.id}`,
          hitsPerPage: 1000,
          attributesToRetrieve: ['shares'],
        })
        const sum = (res.hits || []).reduce((acc: number, hit: any) => acc + (Number(hit.shares) || 0), 0)
        setTotalStakedStroops(sum)
      } catch (e) {
        console.error('Error fetching total staked shares:', e)
        setTotalStakedStroops(0)
      }
    }
    fetchTotalStake()
  }, [user.id])

  const stakedHitz = stroopsToToken(totalStakedStroops, AssetType.HITZ)
  const xlmPrice = Number.parseFloat((priceData?.xlmPrice as string) || '0') || 0
  const hitzPriceXlm = Number.parseFloat((hitzPriceData?.hitzPriceXlm as string) || '0') || 0
  
  // Calculate total USD value including XLM, HITZ, and staked HITZ
  const xlmValue = (credits?.userCredits || 0) * xlmPrice
  const hitzValue = (hitzBalanceData?.userHitzBalance || 0) * hitzPriceXlm * xlmPrice
  const stakedValue = stakedHitz * hitzPriceXlm * xlmPrice
  const approxUsd = xlmValue + hitzValue + stakedValue

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
    if (selectedAsset === AssetType.XLM && (credits?.userCredits || 0) < MIN_WITHDRAWAL_AMOUNT) {
      setLowBalanceModalVisible(true)
      return
    }
    setWithdrawVisible(true)
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
          {/* <View className="mb-4 w-full flex-row items-center">
            {`${displayBalance.toFixed(2)}`} <AssetSelector />
          </View> */}

          {/* Balance Display (XLM, HITZ, Staked) */}
          <View className="mb-0.5 flex w-full flex-row items-center justify-between">
            <View className="ml-2 flex items-start gap-2">
              <View className="ml-2 flex flex-row items-center gap-2">
                <P className="flex flex-row items-center font-bold font-unbounded text-[--text-color] gap-2 text-sm">
                  <Stellar size={18} />
                  {`${(credits?.userCredits || 0).toFixed(7)} XLM`}
                </P>
              </View>
              {hitzBalanceData?.userHitzBalance && hitzBalanceData?.userHitzBalance > 0 ? <View className="ml-2 flex flex-row items-center gap-2">
                <P className="flex flex-row items-center font-bold font-unbounded text-[--text-color] gap-2 text-sm">
                  <SkyhitzLogo size={18} className="text-[--text-color]" id="profile" />
                  {`${(hitzBalanceData?.userHitzBalance || 0).toFixed(1)} HITZ`}
                </P>
                {isClaimingEarnings ? <ActivityIndicator size="small" /> : null}
              </View> : null}
              <View className="ml-2 flex flex-row items-center gap-2">
                <P className="flex flex-row items-center font-bold font-unbounded text-[--text-color] gap-2 text-sm">
                  <Lock size={18} />
                  {`${stakedHitz.toFixed(1)} HITZ (staked)`}
                </P>
              </View>
              <View className="w-full flex flex-row items-center justify-between">
                <P className="ml-2 font-unbounded text-[--text-color] text-sm">{`≈   $${approxUsd.toFixed(2)} total value`}</P>
              </View>
            </View>
            {/* Send button */}
            <View className="mr-2 flex h-full flex-col flex-grow items-end justify-end">
              <P
                className="cursor-pointer flex flex-row items-end justify-end font-bold decoration-2 font-unbounded text-[--text-color]"
                onPress={handleWithdraw}
              >
                <Send size={18} className="text-blue mr-2" />
                Send
              </P>
            </View>
          </View>
          
          <View className="my-4 px-4 w-full items-start justify-center">
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

            {/* Upload feature - Available to all users */}
            <TextLink href="/upload">
              <ProfileRow
                title="Upload"
                icon={
                  <Upload className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                }
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

            {/* Curator-only sections */}
            {isCurator && (
              <>
                <TextLink href="/profile/pending-uploads">
                  <ProfileRow
                    title="Pending Uploads"
                    icon={
                      <Upload className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                    }
                    count={pendingUploadsCountData?.pendingUploadsCount || 0}
                  />
                </TextLink>

                <TextLink href="/profile/curators">
                  <ProfileRow
                    title="Manage Curators"
                    icon={
                      <Users className="h-5 w-5 fill-none stroke-current stroke-2 text-[--text-color]" />
                    }
                  />
                </TextLink>
              </>
            )}
          </View>
        </View>
      </View>

      <LowBalanceModal
        visible={lowBalanceModalVisible}
        onClose={() => setLowBalanceModalVisible(false)}
        minWithdrawalAmount={MIN_WITHDRAWAL_AMOUNT}
      />

      <WithdrawModal
        visible={withdrawVisible}
        onClose={() => {
          setWithdrawVisible(false)
          refetchUserCredits()
          refetchHitzBalance()
        }}
      />
    </SafeAreaView>
  )
}
