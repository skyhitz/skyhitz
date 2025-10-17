'use client'
import { View } from 'react-native'
import { Button } from 'app/design/button'
import { Entry } from 'app/api/graphql/types'
import Stellar from 'app/ui/icons/stellar'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useCallback, useState, useEffect } from 'react'
import { useToast } from 'app/provider/toast'
import { lumensToStroops, stroopsToLumens } from 'app/utils'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { P } from 'app/design/typography'
import { useMutation, useQuery } from '@apollo/client'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { sharesIndex } from 'app/api/algolia'
import { INVEST_ENTRY, UNSTAKE_ENTRY, USER_CREDITS, USER_HITZ_BALANCE } from 'app/api/graphql/operations'
import { INVEST_MIN_XLM } from 'app/constants/constants'
import { stroopsToToken } from 'app/types/asset'
import { AssetType } from 'app/types/asset'
import { SkyhitzLogo } from 'app/ui/logo'


type Share = { shares: number }

type Props = {
  entry: Entry
}

export function InvestSection({ entry }: Props) {
  const [amountToInvest, setAmountToInvest] = useState('')
  const [shares, setShares] = useState(0)
  const user = useUserStore((state) => state.user)

  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const [unstake, { loading: unstakeLoading }] = useMutation(UNSTAKE_ENTRY)
  const { data: creditsData, refetch: refetchCredits } = useQuery(USER_CREDITS)
  const { data: hitzBalanceData } = useQuery(USER_HITZ_BALANCE, { skip: !user })

  const [equityToBuy, setEquityToBuy] = useState('')
  const [amountToUnstake, setAmountToUnstake] = useState('')
  const toast = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const { push } = useRouter()
  const { refetch } = useGetEntry({
    id: entry.id,
  })

  // Fetch user's shares for this entry
  const fetchShares = async () => {
    if (!user) return

    try {
      // Search for shares where entryId and userId match
      const { hits } = await sharesIndex.search('', {
        filters: `entryId:${entry.id} AND userId:${user.id}`,
      })

      const sharesObject = hits[0] as unknown as Share
      const userStroops = sharesObject ? sharesObject.shares : 0
      setShares(userStroops)
    } catch (error) {
      console.error('Error fetching shares:', error)
    }
  }

  // Fetch shares when user changes
  useEffect(() => {
    fetchShares()
  }, [user, entry.id])

  // Calculate the equity to buy when amount changes
  useEffect(() => {
    if (!amountToInvest) {
      setEquityToBuy('')
      return
    }

    const totalStaked = Number(entry.totalStaked || 0) * 10_000_000 // Convert to stroops
    if (totalStaked === 0) {
      setEquityToBuy('100')
      return
    }

    const amountInStroops = Math.trunc(lumensToStroops(parseFloat(amountToInvest)))
    const newTotalStaked = totalStaked + amountInStroops
    const currentOwnershipPercentage =
      totalStaked > 0 ? (shares / totalStaked) * 100 : 0

    // Calculate the user's new ownership percentage after the investment
    const newUserStake = shares + amountInStroops
    const newOwnershipPercentage = (newUserStake / newTotalStaked) * 100

    // Calculate the additional percentage (what they're buying)
    const additionalPercentage =
      newOwnershipPercentage - currentOwnershipPercentage

    setEquityToBuy(additionalPercentage.toFixed(4))
  }, [amountToInvest, entry.totalStaked, shares])

  // Minimum investment in XLM (eligible for shares)
  const MIN_INVESTMENT_XLM = INVEST_MIN_XLM

  const onSubmit = useCallback(async () => {
    if (!user) return push('/sign-in')

    if (!amountToInvest || isNaN(parseFloat(amountToInvest))) {
      toast.show('Please enter a valid amount', { type: 'error' })
      return
    }

    const numAmount = parseFloat(amountToInvest)
    if (numAmount < MIN_INVESTMENT_XLM) {
      toast.show(`Minimum investment is ${MIN_INVESTMENT_XLM} XLM`, {
        type: 'error',
      })
      return
    }

    try {
      setLoading(true)
      const { data } = await invest({
        variables: {
          id: entry.id,
          amount: lumensToStroops(parseFloat(amountToInvest)),
        },
      })

      if (data?.investEntry?.success) {
        const credits = await refetchCredits()
        const newBal = Number(credits?.data?.userCredits ?? 0).toFixed(2)
        await refetch() // Refresh entry (tvl/apr)
        await fetchShares() // Refresh your shares
        toast.show(`Investment successful! Balance: ${newBal} XLM`, { type: 'success' })
        setAmountToInvest('')
      } else {
        const errorMessage =
          data?.investEntry?.message || 'Failed to process investment'
        toast.show(errorMessage, { type: 'error' })
      }
    } catch (error) {
      console.error('Investment error:', error)
      toast.show('Error processing investment', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [amountToInvest, entry.id, invest, refetch, refetchCredits, toast, user])

  // Calculate available credits and ownership percentage
  const userCredits = creditsData?.userCredits || 0
  const totalStakedStroops = Number(entry.totalStaked || 0) * 10_000_000
  const ownershipPercentage = totalStakedStroops > 0 ? (shares / totalStakedStroops) * 100 : 0

  return (
    <View className="my-6 w-full rounded-lg bg-[--bg-secondary-color] p-4">
      <View className="mb-4 gap-2">
        <View className="flex-row">
          <P className="text-[--text-secondary-color] mr-1 font-unbounded text-xs">
            Total Staked:{' '}
          </P>
          <P className="font-unbounded text-xs">
            {`${(entry.totalStaked || 0).toFixed(2)} HITZ`}
          </P>
        </View>
        <View className="flex-row">
          <P className="text-[--text-secondary-color] mr-1 font-unbounded text-xs">
            APR:{' '}
          </P>
          <P className="text-[--primary-color] font-unbounded text-xs">
            {`${entry.apr}%`}
          </P>
        </View>
        {user && (
          <View className="flex-row items-center">
            <P className="text-[--text-secondary-color] mr-1 font-unbounded text-xs">
              Share:{' '}
            </P>
            <P className="text-[--text-color] font-unbounded text-xs">
              {`${ownershipPercentage.toFixed(2)}%`}
            </P>
            {equityToBuy ? (
              <P className="!text-[--primary-color] font-unbounded text-xs">
                {` +${Number(equityToBuy).toFixed(2)}%`}
              </P>
            ) : null}
          </View>
        )}
        {user && (
          <View className="flex-col gap-2">
            <View className="flex-row">
              <P className="text-[--text-secondary-color] text-xs font-unbounded">
                XLM balance:{' '}
              </P>
              <P className="text-[--text-color] text-xs font-unbounded">
                {`${userCredits} XLM`}
              </P>
            </View>
            <View className="flex-row">
              <P className="text-[--text-secondary-color] text-xs font-unbounded">
                HITZ balance:{' '}
              </P>
              <P className="text-[--text-color] text-xs font-unbounded">
                {`${(hitzBalanceData?.userHitzBalance || 0).toFixed(2)} HITZ`}
              </P>
            </View>
            <View className="flex-row">
              <P className="text-[--text-secondary-color] text-xs font-unbounded">
                Your stake:{' '}
              </P>
              <P className="text-[--text-color] text-xs font-unbounded">
                {`${stroopsToToken(shares, AssetType.HITZ).toFixed(2)} HITZ`}
              </P>
            </View>
          </View>
        )}

        <FormInputWithIcon
          icon={<Stellar size={18} />}
          value={amountToInvest}
          onChangeText={setAmountToInvest}
          placeholder={`Amount to invest (min ${INVEST_MIN_XLM} XLM)`}
          keyboardType="numeric"
          className="my-4"
        />
        <P className="text-center text-xs text-[--text-secondary-color] italic mt-1 mb-3">
          Minimum investment: {INVEST_MIN_XLM} XLM
        </P>
      </View>

      <Button
        onPress={onSubmit}
        loading={loading || investLoading}
        disabled={
          !user ||
          !amountToInvest ||
          isNaN(parseFloat(amountToInvest)) ||
          parseFloat(amountToInvest) < MIN_INVESTMENT_XLM ||
          loading ||
          investLoading
        }
        text="Invest Now"
        className="w-full bg-[--invest-button-bg-color] hover:bg-[--invest-button-bg-color] border-0 font-semibold"
      />

      <P className="mt-4 text-center text-xs text-[--text-secondary-color]">
        By investing, you are purchasing shares in this creation's future
        earnings.
      </P>

      {user && shares > 0 ? (
        <View className="mt-8 border-t border-[--divider-color] pt-6">
          <P className="mb-2 text-center font-unbounded text-xs text-[--text-secondary-color]">
            Unstake HITZ
          </P>
          <FormInputWithIcon
            icon={<SkyhitzLogo size={18} id="entry" className='text-[--text-color]' />}
            value={amountToUnstake}
            onChangeText={setAmountToUnstake}
            placeholder={`Amount to unstake (max ${stroopsToLumens(shares)} HITZ)`}
            keyboardType="numeric"
            className="my-4"
          />
          <P className="text-center text-xs text-[--text-secondary-color] italic mt-1 mb-3">
            Withdraw your staked HITZ back to your wallet. You'll lose future rewards from this entry.
          </P>

          <Button
            onPress={async () => {
              if (!user) return push('/sign-in')
              if (!amountToUnstake || isNaN(parseFloat(amountToUnstake))) {
                toast.show('Please enter a valid amount', { type: 'error' })
                return
              }
              const asStroops = Math.trunc(lumensToStroops(parseFloat(amountToUnstake)))
              if (asStroops <= 0) {
                toast.show('Amount must be greater than 0', { type: 'error' })
                return
              }
              if (asStroops > shares) {
                toast.show('Amount exceeds your stake', { type: 'error' })
                return
              }

              try {
                setLoading(true)
                const { data } = await unstake({
                  variables: {
                    id: entry.id,
                    amount: asStroops,
                  },
                })
                if (data?.unstakeEntry?.success) {
                  await refetch()
                  await fetchShares()
                  const amount = data.unstakeEntry.unstakedAmount.toFixed(2)
                  toast.show(`Successfully unstaked ${amount} HITZ`, { type: 'success' })
                  setAmountToUnstake('')
                } else {
                  toast.show('Failed to unstake', { type: 'error' })
                }
              } catch (e) {
                console.error('Unstake error:', e)
                toast.show('Error processing unstake', { type: 'error' })
              } finally {
                setLoading(false)
              }
            }}
            loading={unstakeLoading || loading}
            disabled={
              !user ||
              !amountToUnstake ||
              isNaN(parseFloat(amountToUnstake)) ||
              Math.trunc(lumensToStroops(parseFloat(amountToUnstake))) <= 0 ||
              Math.trunc(lumensToStroops(parseFloat(amountToUnstake))) > shares ||
              unstakeLoading ||
              loading
            }
            text="Unstake Now"
            className="w-full bg-orange-500 hover:bg-orange-600 border-0 font-semibold"
          />
          <P className="mt-4 text-center text-xs text-[--text-secondary-color]">
            Your HITZ will be returned to your wallet. You can then transfer them out or re-stake elsewhere.
          </P>
        </View>
      ) : null}
    </View>
  )
}

// Wrap the component with an authentication check if needed
export default InvestSection
