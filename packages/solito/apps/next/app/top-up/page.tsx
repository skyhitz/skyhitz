import { View, ScrollView } from 'react-native'
import CheckoutForm from 'app/ui/payments/checkout-form'
import { H1 } from 'app/design/typography'
import { Metadata } from 'next'
import { Config } from 'app/config'
import { ComponentAuthGuard } from 'app/utils/authGuard'
import { SafeAreaView } from 'app/design/safe-area-view'

export const metadata: Metadata = {
  title: 'Skyhitz - Top Up',
  description: 'Add XLM to your Skyhitz account',
  alternates: {
    canonical: `${Config.APP_URL}/top-up`,
  },
}

export default function TopUpPage() {
  return (
    <ComponentAuthGuard>
      <SafeAreaView>
        <ScrollView>
          <View className="mx-auto flex min-h-screen w-full items-center justify-center px-4 py-8">
            <H1 className="text-center text-lg text-white mb-6 font-unbounded">
              Top Up
            </H1>
            <CheckoutForm />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ComponentAuthGuard>
  )
}
