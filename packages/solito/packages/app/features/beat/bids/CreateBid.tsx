'use client'
import { View } from 'react-native'
import { Button } from 'app/design/button'
import { Entry } from 'app/api/graphql/types'
import Stellar from 'app/ui/icons/stellar'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useCallback, useState, useEffect } from 'react'
import { useToast } from 'app/provider/toast'
import { useUserStore } from 'app/state/user'
import { P } from 'app/design/typography'
import { useMutation, useQuery } from '@apollo/client'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { sharesIndex } from 'app/api/algolia'
import { INVEST_ENTRY, USER_CREDITS } from 'app/api/graphql/operations'

// Helper functions for XLM conversion
const lumensToStroops = (lumens: number) => (lumens * 10000000).toString()
const stroopsToLumens = (stroops: string) => parseInt(stroops) / 10000000

type Share = { shares: number }

type Props = {
  entry: Entry
}

export function CreateBid({ entry }: Props) {
  const [amountToInvest, setAmountToInvest] = useState('')
  const [shares, setShares] = useState(0)

  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const { data: creditsData, refetch: refetchCredits } = useQuery(USER_CREDITS)

  const [equityToBuy, setEquityToBuy] = useState('')
  const toast = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const user = useUserStore((state) => state.user)
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

    if (Number(entry.tvl) === 0 || !entry?.tvl) {
      setEquityToBuy('100')
      return
    }

    const amountInStroops = parseInt(
      lumensToStroops(parseInt(amountToInvest, 10)),
      10
    )
    const entryTvl = Number(entry.tvl)
    const newTvl = entryTvl + amountInStroops
    const currentOwnershipPercentage =
      entryTvl > 0 ? (shares / entryTvl) * 100 : 0

    // Calculate the user's new ownership percentage after the investment
    const newUserStroops = shares + amountInStroops
    const newOwnershipPercentage = (newUserStroops / newTvl) * 100

    // Calculate the additional percentage (what they're buying)
    const additionalPercentage =
      newOwnershipPercentage - currentOwnershipPercentage

    setEquityToBuy(additionalPercentage.toFixed(4))
  }, [amountToInvest, entry.tvl, shares])

  // Minimum investment in XLM
  const MIN_INVESTMENT_XLM = 1

  const onSubmit = useCallback(async () => {
    if (!user) {
      toast.show('You need to be logged in to invest', { type: 'error' })
      return
    }

    if (!amountToInvest || isNaN(parseInt(amountToInvest, 10))) {
      toast.show('Please enter a valid amount', { type: 'error' })
      return
    }

    const numAmount = parseInt(amountToInvest, 10)
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
          amount: parseFloat(lumensToStroops(parseInt(amountToInvest, 10))),
        },
      })

      if (data?.investEntry?.success) {
        toast.show('Investment successful!', { type: 'success' })
        setAmountToInvest('')
        refetchCredits()
        refetch() // Refresh entry data after investment
        fetchShares() // Update shares data after successful investment
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
  const ownershipPercentage = entry.tvl ? (shares / Number(entry.tvl)) * 100 : 0

  return (
    <View className="my-6 w-full rounded-lg bg-[--bg-secondary-color] p-4">
      <View className="mb-4 gap-2">
        <View className="flex-row">
          <P className="text-[--text-secondary-color] mr-1 font-unbounded text-xs">
            TVL:{' '}
          </P>
          <P className="font-unbounded text-xs">
            {`${stroopsToLumens(entry.tvl?.toString() || '0')} XLM`}
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
        <View className="flex-row">
          <P className="text-[--text-secondary-color] text-xs font-unbounded">
            Your balance:{' '}
          </P>
          <P className="text-[--text-color] text-xs font-unbounded">
            {`${userCredits} XLM`}
          </P>
        </View>

        <FormInputWithIcon
          icon={<Stellar size={18} />}
          value={amountToInvest}
          onChangeText={setAmountToInvest}
          placeholder="Amount to invest (min 1 XLM)"
          keyboardType="numeric"
          className="my-4"
        />
        <P className="text-center text-xs text-[--text-secondary-color] italic mt-1 mb-3">
          Minimum investment: 1 XLM
        </P>
      </View>

      <Button
        onPress={onSubmit}
        loading={loading || investLoading}
        disabled={
          !user ||
          !amountToInvest ||
          parseInt(amountToInvest, 10) < MIN_INVESTMENT_XLM ||
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
    </View>
  )
}

// Wrap the component with an authentication check if needed
export default CreateBid
