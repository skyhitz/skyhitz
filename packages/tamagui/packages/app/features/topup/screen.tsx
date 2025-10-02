'use client'
import { ScrollView, YStack } from 'tamagui'
import { H1 } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'
import CheckoutForm from 'app/ui/payments/checkout-form'

export function TopUpScreen() {
  return (
    <SafeAreaView backgroundColor="$background" width="100%">
      <ScrollView>
        <YStack marginHorizontal="auto" minHeight="100vh" width="100%" alignItems="center" justifyContent="center" paddingHorizontal="$4" paddingVertical="$8">
          <H1 textAlign="center" fontSize="$5">Top Up</H1>
          <CheckoutForm />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  )
}
