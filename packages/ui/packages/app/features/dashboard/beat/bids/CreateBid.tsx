import { View } from 'react-native'
import { Button } from 'app/design/button'
import {
  Entry,
  useInvestEntryMutation,
  useUserCreditsQuery,
} from 'app/api/graphql'
import Dollar from 'app/ui/icons/dollar'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import PieChartIcon from 'app/ui/icons/pie'
import { useCallback, useEffect, useState } from 'react'
import { useErrorReport } from 'app/hooks/useErrorReport'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { useToast } from 'app/provider/toast'
import { useUserAtomState } from 'app/state/user'
import { H2 } from 'app/design/typography'
import { lumensToStroops, stroopsToLumens } from 'app/utils'
import Icon from 'app/ui/icons/dollar'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { sharesIndex } from 'app/api/algolia'

type Props = {
  entry: Entry
}

type Share = { shares: number }

export function CreateBid({ entry }: Props) {
  const [amountToInvest, setAmountToInvest] = useState('')
  const [shares, setShares] = useState(0)

  const [invest] = useInvestEntryMutation()
  const { refetch: refetchCredits } = useUserCreditsQuery()

  const [equityToBuy, setEquityToBuy] = useState('')
  const reportError = useErrorReport()
  const toast = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const { user } = useUserAtomState()
  const { refetch } = useGetEntry({
    id: entry.id,
  })

  const onSubmit = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await invest({
        variables: {
          id: entry.id!,
          amount: lumensToStroops(parseInt(amountToInvest, 10)),
        },
      })
      if (!data?.investEntry.success) {
        throw Error('Error during transaction creation.')
      }

      // Reset form fields
      setAmountToInvest('')
      setEquityToBuy('')

      // Fetch updated data
      refetch()
      await fetchShares()

      // Get the latest user credits data
      const { data: creditsData } = await refetchCredits()
      const newBalance = creditsData?.userCredits ?? 0

      // Show toast with balance information
      toast.show(
        `Investment successful! Your new balance is ${newBalance.toFixed(
          2,
        )} XLM`,
        {
          type: 'success',
        },
      )
      setLoading(false)
    } catch (ex) {
      setLoading(false)
      reportError(ex)
    }
  }, [
    amountToInvest,
    equityToBuy,
    setLoading,
    toast,
    reportError,
    refetchCredits,
  ])

  const fetchShares = async () => {
    if (!user) {
      return
    }
    // entryId and userId should be on facet attributes with filterOnly for this to work
    const { hits } = await sharesIndex.search('', {
      filters: `entryId:${entry.id} AND userId:${user.id}`,
      cacheable: false,
    })

    const sharesObject = hits[0] as unknown as Share
    const userStroops = sharesObject ? sharesObject.shares : 0
    setShares(userStroops)
  }

  useEffect(() => {
    fetchShares()
  }, [user])

  useEffect(() => {
    if (!amountToInvest) {
      return
    }

    if (entry.tvl === 0 || !entry?.tvl) {
      setEquityToBuy('100')
      return
    }

    const amountInStroops = lumensToStroops(parseInt(amountToInvest))
    const newTvl = entry.tvl + amountInStroops
    const currentOwnershipPercentage = entry.tvl
      ? (shares / entry.tvl) * 100
      : 0

    // Calculate the user's new ownership percentage after the investment
    const newUserStroops = shares + amountInStroops
    const newOwnershipPercentage = (newUserStroops / newTvl) * 100

    // Calculate the additional percentage
    const additionalPercentage =
      newOwnershipPercentage - currentOwnershipPercentage

    setEquityToBuy(
      currentOwnershipPercentage === currentOwnershipPercentage
        ? currentOwnershipPercentage.toString()
        : additionalPercentage.toString(),
    )
  }, [amountToInvest])

  const tvl = entry.tvl ? stroopsToLumens(entry.tvl) : 0
  const ownershipPercentage = entry.tvl ? (shares / entry.tvl) * 100 : 0

  return (
    <>
      <ComponentAuthGuard>
        <View className="border-grey-light mt-4 flex items-center gap-y-4 rounded-lg border-[0.5px] p-4 md:items-start">
          {tvl ? (
            <H2 className="flex flex-row items-center text-sm">
              TVL : <Icon className={'mx-1'} size={12} />
              {tvl} XLM
            </H2>
          ) : null}
          {entry.apr ? <H2 className="text-sm">APR : {entry.apr}%</H2> : null}
          {ownershipPercentage ? (
            <H2 className="text-sm">
              Share : {ownershipPercentage.toFixed(4)}%
            </H2>
          ) : null}
          <View className="flex items-center md:flex-row">
            <FormInputWithIcon
              containerClassNames="border border-white rounded p-5 md:mr-2 mb-2 md:mb-0"
              icon={Dollar}
              value={amountToInvest}
              onChangeText={(text) => {
                if (text === '') {
                  setAmountToInvest('')
                } else {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
                  setAmountToInvest(num.toString())
                }
              }}
              className="text-md border-grey-light ml-2 rounded-md border-[0.5px] px-4 py-2 font-bold text-gray-600 focus:border-gray-600 focus-visible:outline-gray-600"
              placeholder="Amount (XLM)"
              keyboardType="numeric"
              maxLength={10}
            />
            <FormInputWithIcon
              containerClassNames="border border-white rounded p-5 md:ml-2"
              icon={PieChartIcon}
              value={equityToBuy}
              // onChangeText={(text) => {
              //   if (text === '') {
              //     setEquityToBuy('')
              //   } else {
              //     const num = parseInt(text.replace(/[^0-9]/g, ''), 10)
              //     if (num <= 100 && num >= 1) {
              //       setEquityToBuy(num.toString())
              //     }
              //   }
              // }}
              placeholder="Pool share %"
              keyboardType="numeric"
              maxLength={10}
              editable={false}
            />
          </View>
          <Button
            text="Invest"
            onPress={onSubmit}
            disabled={!amountToInvest || !equityToBuy || loading}
            loading={loading}
            className="w-full"
          />
        </View>
      </ComponentAuthGuard>
    </>
  )
}
