'use client'
import React from 'react'
import { View, TextInput } from 'react-native'
import { H1, P, Button } from 'app/design/typography'
import { useMutation, useQuery } from '@apollo/client'
import { ISSUE_CARD, MY_CARD, USER_CREDITS, CARD_REVEAL_EMBED } from 'app/api/graphql/operations'

export function SpendScreen() {
  const { data: balanceData, refetch: refetchCredits } = useQuery(USER_CREDITS, { fetchPolicy: 'network-only' })
  const { data: cardData, refetch: refetchCard } = useQuery(MY_CARD, { fetchPolicy: 'network-only' })
  const hasCard = !!cardData?.myCard
  const { data: embedData, refetch: refetchEmbed } = useQuery(CARD_REVEAL_EMBED, { fetchPolicy: 'network-only', skip: !hasCard })
  const [issueCard, { loading: issuing }] = useMutation(ISSUE_CARD)
  const [name, setName] = React.useState('')
  const [address1, setAddress1] = React.useState('')
  const [address2, setAddress2] = React.useState('')
  const [city, setCity] = React.useState('')
  const [state, setState] = React.useState('')
  const [postalCode, setPostalCode] = React.useState('')
  const [country, setCountry] = React.useState('US')
  const [showReveal, setShowReveal] = React.useState(false)

  const balance = Number(balanceData?.userCredits ?? 0)

  const handleIssue = async () => {
    if (balance < 6) {
      alert('You need at least 6 XLM to issue a card')
      return
    }
    if (!name || !address1 || !city || !postalCode || !country) {
      alert('Please complete name and full billing address')
      return
    }
    try {
      await issueCard({
        variables: {
          input: {
            name,
            addressLine1: address1,
            addressLine2: address2 || null,
            city,
            state: state || null,
            postalCode,
            country,
          },
        },
      })
      await Promise.all([refetchCredits(), refetchCard()])
    } catch (e: any) {
      alert(e?.message || 'Failed to issue card')
    }
  }

  return (
    <View className="mx-auto w-full max-w-2xl p-4">
      <H1 className="mb-4">Spend</H1>
      <P className="mb-3">Balance: {balance.toFixed(2)} XLM</P>
      {!hasCard ? (
        <View className="rounded-lg border border-[--border-color] p-4 bg-[--bg-color]">
          <P className="mb-2">Enter your legal name and billing address</P>
          <TextInput value={name} onChangeText={setName} placeholder="Full name" className="mb-2 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
          <TextInput value={address1} onChangeText={setAddress1} placeholder="Address line 1" className="mb-2 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
          <TextInput value={address2} onChangeText={setAddress2} placeholder="Address line 2 (optional)" className="mb-2 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
          <View className="flex flex-row gap-2">
            <TextInput value={city} onChangeText={setCity} placeholder="City" className="flex-1 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
            <TextInput value={state} onChangeText={setState} placeholder="State/Region" className="w-40 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
          </View>
          <View className="mt-2 flex flex-row gap-2">
            <TextInput value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" className="w-40 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
            <TextInput value={country} onChangeText={setCountry} placeholder="Country (ISO e.g. US)" className="w-52 rounded-md border border-[--border-color] px-3 py-2 text-[--text-color]" />
          </View>
          <Button onPress={handleIssue} disabled={issuing || balance < 6}>
            {issuing ? 'Issuing…' : 'Issue Virtual Card'}
          </Button>
        </View>
      ) : (
        <View className="mt-4 rounded-lg border border-[--border-color] p-4 bg-[--bg-color]">
          <P className="mb-2">Card: {cardData?.myCard?.brand ?? 'Virtual'}</P>
          <P className="mb-2">Last4: {cardData?.myCard?.last4 ?? '••••'}</P>
          <P className="mb-2">Exp: {cardData?.myCard?.expMonth}/{cardData?.myCard?.expYear}</P>
          <P className="mb-4">Status: {cardData?.myCard?.status}</P>
          <View className="flex flex-row gap-2">
            <Button onPress={async () => { await refetchEmbed(); setShowReveal(true) }} className="bg-primary">
              Reveal Card Details (secure)
            </Button>
            <Button disabled className="bg-gray-600">
              Add to Apple Wallet (placeholder)
            </Button>
            <Button disabled className="bg-gray-600">
              Add to Google Wallet (placeholder)
            </Button>
          </View>
          {showReveal && (
            <View className="mt-4 rounded-md border border-[--border-color] p-3 bg-[--bg-color]">
              <P className="mb-1 text-xs">Card details (secure embed):</P>
              <iframe
                src={embedData?.cardRevealEmbed?.url || ''}
                className="w-full h-64 rounded-md border border-[--border-color]"
              />
              <Button className="mt-2" onPress={() => setShowReveal(false)}>Close</Button>
            </View>
          )}
        </View>
      )}
    </View>
  )
}


