'use client'
import { View, ScrollView } from 'react-native'
import { H1 } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import CheckoutForm from 'app/ui/payments/checkout-form'

export function TopUpScreen() {
  return (
    <SafeAreaView className="bg-[--bg-color] w-full">
      <ScrollView>
        <View className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-8">
          <H1 className="text-center text-lg">Top Up</H1>
          <CheckoutForm />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
