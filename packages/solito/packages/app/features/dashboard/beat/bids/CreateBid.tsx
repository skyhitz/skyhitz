'use client'
import { View } from 'react-native'
import { Button } from 'app/design/button'
import { Entry } from 'app/api/graphql/types'
import Dollar from 'app/ui/icons/dollar'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import { useCallback, useState } from 'react'
import { useToast } from 'app/provider/toast'
import { useUserStore } from 'app/state/user'
import { H2, P } from 'app/design/typography'
import { gql, useMutation, useQuery } from '@apollo/client'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'

// Define the GraphQL mutations and queries we need
const INVEST_ENTRY = gql`
  mutation InvestEntry($id: String!, $amount: String!) {
    investEntry(id: $id, amount: $amount)
  }
`

const USER_CREDITS = gql`
  query UserCredits {
    userCredits
  }
`

// Helper functions for XLM conversion
const lumensToStroops = (lumens: number) => (lumens * 10000000).toString()
const stroopsToLumens = (stroops: string) => parseInt(stroops) / 10000000

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

  const onSubmit = useCallback(async () => {
    if (!user) {
      toast.show('You need to be logged in to invest', { type: 'error' })
      return
    }

    if (!amountToInvest || isNaN(parseInt(amountToInvest, 10))) {
      toast.show('Please enter a valid amount', { type: 'error' })
      return
    }

    try {
      setLoading(true)
      const { data } = await invest({
        variables: {
          id: entry.id,
          amount: lumensToStroops(parseInt(amountToInvest, 10)),
        },
      })

      if (data?.investEntry) {
        toast.show('Investment successful!', { type: 'success' })
        setAmountToInvest('')
        refetchCredits()
        refetch()
      } else {
        toast.show('Failed to process investment', { type: 'error' })
      }
    } catch (error) {
      console.error('Investment error:', error)
      toast.show('Error processing investment', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [amountToInvest, entry.id, invest, refetch, refetchCredits, toast, user])

  // Calculate available credits
  const userCredits = creditsData?.userCredits || 0

  return (
    <View className="mt-6 w-full rounded-lg bg-gray-900 p-4">
      <H2 className="mb-4 text-xl font-bold">Invest in this beat</H2>
      
      <View className="mb-4">
        <P className="mb-2">Your balance: {userCredits} XLM</P>
        
        <FormInputWithIcon
          icon={<Dollar />}
          value={amountToInvest}
          onChangeText={setAmountToInvest}
          placeholder="Amount to invest (XLM)"
          keyboardType="numeric"
        />
      </View>
      
      <Button
        onPress={onSubmit}
        loading={loading || investLoading}
        disabled={!user || !amountToInvest || loading || investLoading}
        text="Invest Now"
        className="w-full"
      />
      
      <P className="mt-2 text-center text-xs text-gray-400">
        By investing, you are purchasing shares in this beat's future earnings
      </P>
    </View>
  )
}

// Wrap the component with an authentication check if needed
export default CreateBid
