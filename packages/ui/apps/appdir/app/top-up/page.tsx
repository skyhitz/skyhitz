'use client'

import { View, ScrollView } from 'react-native'
import CheckoutForm from 'app/ui/payments/checkout-form'
import { H1 } from 'app/design/typography'

export default function TopUpPage() {
  return (
    <ScrollView>
      <View className="App mx-auto flex min-h-screen w-full items-center justify-center">
        <H1 className="text-center text-lg">Top Up</H1>
        <CheckoutForm />
      </View>
    </ScrollView>
  )
}
