'use client'
import { YStack, XStack } from 'tamagui'
import { Button } from 'app/design/button'
import { Entry } from 'app/api/graphql/types'
import Stellar from 'app/ui/icons/stellar'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useCallback, useState, useEffect } from 'react'
import { useToast } from 'app/provider/toast'
import { useUserStore } from 'app/state/user'
import { useRouter } from 'app/navigation'
import { P } from 'app/design/typography'
import { useMutation, useQuery } from '@apollo/client'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { sharesIndex } from 'app/api/algolia'
import { INVEST_ENTRY, USER_CREDITS } from 'app/api/graphql/operations'
import { INVEST_MIN_XLM } from 'app/constants/constants'
import { trackInvest } from 'app/utils/analytics'

// Helper functions for XLM conversion
const lumensToStroops = (lumens: number) => (lumens * 10000000).toString()
const stroopsToLumens = (stroops: string) => parseInt(stroops) / 10000000

type Share = { shares: number }

type Props = {
  entry: Entry
}

export function InvestSection({ entry }: Props) {
  const [amountToInvest, setAmountToInvest] = useState('')
  const [shares, setShares] = useState(0)

  const [invest, { loading: investLoading }] = useMutation(INVEST_ENTRY)
  const { data: creditsData, refetch: refetchCredits } = useQuery(USER_CREDITS)

  const [equityToBuy, setEquityToBuy] = useState('')
  const toast = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const user = useUserStore((state) => state.user)
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

    if (Number(entry.tvl) === 0 || !entry?.tvl) {
      setEquityToBuy('100')
      return
    }

    const amountInStroops = parseInt(
      lumensToStroops(parseFloat(amountToInvest)),
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
          amount: parseFloat(lumensToStroops(parseFloat(amountToInvest))),
        },
      })

      if (data?.investEntry?.success) {
        // Track invest event
        trackInvest(entry.id, numAmount, 'XLM', entry.title, entry.artist)
        
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
  const ownershipPercentage = entry.tvl ? (shares / Number(entry.tvl)) * 100 : 0

  return (
    <YStack marginVertical="$6" width="100%" borderRadius="$3" backgroundColor="$backgroundHover" padding="$4">
      <YStack marginBottom="$4" gap="$2">
        <XStack flexDirection="row">
          <P color="$color11" marginRight="$1" fontFamily="$heading" fontSize="$2">
            TVL:{' '}
          </P>
          <P fontFamily="$heading" fontSize="$2">
            {`${stroopsToLumens(entry.tvl?.toString() || '0')} XLM`}
          </P>
        </XStack>
        <XStack flexDirection="row">
          <P color="$color11" marginRight="$1" fontFamily="$heading" fontSize="$2">
            APR:{' '}
          </P>
          <P color="$blue9" fontFamily="$heading" fontSize="$2">
            {`${entry.apr}%`}
          </P>
        </XStack>
        {user && (
          <XStack flexDirection="row" alignItems="center">
            <P color="$color11" marginRight="$1" fontFamily="$heading" fontSize="$2">
              Share:{' '}
            </P>
            <P color="$color" fontFamily="$heading" fontSize="$2">
              {`${ownershipPercentage.toFixed(2)}%`}
            </P>
            {equityToBuy ? (
              <P color="$blue9" fontFamily="$heading" fontSize="$2">
                {` +${Number(equityToBuy).toFixed(2)}%`}
              </P>
            ) : null}
          </XStack>
        )}
        {user && (
          <XStack flexDirection="row">
            <P color="$color11" fontSize="$2" fontFamily="$heading">
              Your balance:{' '}
            </P>
            <P color="$color" fontSize="$2" fontFamily="$heading">
              {`${userCredits} XLM`}
            </P>
          </XStack>
        )}

        <FormInputWithIcon
          icon={<Stellar size={18} />}
          value={amountToInvest}
          onChangeText={setAmountToInvest}
          placeholder={`Amount to invest (min ${INVEST_MIN_XLM} XLM)`}
          keyboardType="numeric"
          marginVertical="$4"
        />
        <P textAlign="center" fontSize="$2" color="$color11" fontStyle="italic" marginTop="$1" marginBottom="$3">
          Minimum investment: {INVEST_MIN_XLM} XLM
        </P>
      </YStack>

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
        width="100%"
        backgroundColor="$blue9"
        borderWidth={0}
        fontWeight="600"
      />

      <P marginTop="$4" textAlign="center" fontSize="$2" color="$color11">
        By investing, you are purchasing shares in this creation's future
        earnings.
      </P>
    </YStack>
  )
}

// Wrap the component with an authentication check if needed
export default InvestSection
