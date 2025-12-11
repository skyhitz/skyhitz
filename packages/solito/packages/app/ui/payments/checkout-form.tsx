'use client'

import { useEffect, useRef, useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js'
import {
  loadStripe,
  StripeElementsOptions,
  StripePaymentElementOptions,
} from '@stripe/stripe-js'
import { Config } from 'app/config'
import { Button, P } from 'app/design/typography'
import { View, TextInput, Platform } from 'react-native'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { Formik, FormikProps } from 'formik'
import { topUpFormSchema } from 'app/validation'
import { useCreatePaymentIntentMutation } from 'app/api/graphql/mutations'
import { HITZ_PRICE_USDC } from 'app/api/graphql/operations'
import { useQuery } from '@apollo/client'
import CompletePage from './complete-page'
import { trackTopUp } from 'app/utils/analytics'
import { useUserStore } from 'app/state/user'

type FormFields = {
  email: string
  amount: number
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : ''
)

export default function CheckoutForm() {
  const [amount, setAmount] = useState(1)
  const [confirmed, setConfirmed] = useState<boolean | null>(false)

  const [stripeOptions, setStripeOptions] = useState<StripeElementsOptions>({
    appearance: { theme: 'flat' },
    mode: 'payment',
    amount: 1,
    currency: 'usd',
  })

  useEffect(() => {
    if (Platform.OS === 'web') {
      setConfirmed(
        !!new URLSearchParams(window.location.search).get(
          'payment_intent_client_secret'
        )
      )
    }
  }, [])

  useEffect(() => {
    // This effect will run whenever amount changes, but only if it's not empty
    if (amount) {
      setStripeOptions({
        mode: 'payment',
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
      })
    }
  }, [amount])

  return (
    <Elements options={stripeOptions} stripe={stripePromise}>
      {confirmed ? (
        <CompletePage />
      ) : (
        <InnerCheckoutForm setAmount={setAmount} />
      )}
    </Elements>
  )
}

const InnerCheckoutForm = ({
  setAmount,
}: {
  setAmount: (amount: number) => void
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const user = useUserStore((s) => s.user)
  
  // Fetch real HITZ/USDC price from oracle
  const { data: hitzPriceData } = useQuery(HITZ_PRICE_USDC, {
    pollInterval: 30000, // Refresh every 30 seconds
  })
  const hitzPriceUsdc = Number.parseFloat((hitzPriceData?.hitzPriceUsdc as string) || '0') || 0

  const emailInputRef = useRef<TextInput>(null)
  const amountInputRef = useRef<TextInput>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | undefined>(undefined)

  const [createPaymentIntent, { data, loading, error }] =
    useCreatePaymentIntentMutation()

  const initialValues: FormFields = {
    email: '',
    amount: 10,
  }

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'accordion',
  }

  const handleSubmit = async (values: FormFields) => {
    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return
    }

    setIsLoading(true)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setMessage(submitError.message)
      setIsLoading(false)
      return
    }

    try {
      const { data } = await createPaymentIntent({
        variables: { amount: Number(values.amount) * 100 },
      })

      const clientSecret = data?.createPaymentIntent.clientSecret

      if (!clientSecret) {
        setMessage('An unexpected error occurred.')
        setIsLoading(false)
        return
      }

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: Config.APP_URL + '/top-up',
          payment_method_data: {
            billing_details: {
              email: values.email,
            },
          },
          receipt_email: values.email,
        },
      })

      // Track successful top-up event
      if (!error) {
        trackTopUp(user?.id, 'checkout', values.amount)
      }

      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`.
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message)
      } else {
        setMessage('An unexpected error occurred.')
      }
    } catch (err) {
      setMessage('An error occurred while processing your payment.')
      console.error('Payment error:', err)
    }

    setIsLoading(false)
  }

  const getFee = (amount: number) => {
    return amount * 0.029 + 0.3
  }

  // Estimate HITZ received based on USDC price from oracle
  // Price is in USDC per HITZ (e.g., 0.10 means 1 HITZ = $0.10)
  const getEstimatedHITZ = (amount: number): number | null => {
    if (!hitzPriceUsdc || hitzPriceUsdc <= 0) return null
    const netAmount = amount - getFee(amount)
    // HITZ = USD / (USDC per HITZ)
    return netAmount / hitzPriceUsdc
  }

  return (
    <Formik
      validateOnMount
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={topUpFormSchema}
    >
      {({
        values,
        handleChange,
        handleBlur,
        errors,
        touched,
        isValid,
        handleSubmit,
      }: FormikProps<FormFields>) => (
        <View className="mb-4 bg-white p-6 rounded-lg">
          <StyledTextInput
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            placeholder="Email"
            showFeedback={touched.email}
            valid={!errors.email}
            blurOnSubmit={false}
            ref={emailInputRef}
            onSubmitEditing={() => handleSubmit()}
            editable={!isLoading}
            autoCapitalize="none"
            inputMode="email"
            className="mb-3 mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholderTextColor="grey"
            textInputClassName="!text-gray-900"
          />
          <StyledTextInput
            value={values.amount.toString()}
            // only allow changes if text is a number
            onChangeText={(text) => {
              if (/^\d*\.?\d*$/.test(text)) {
                handleChange('amount')(text)
                setAmount(Number(text))
              }
            }}
            onBlur={handleBlur('amount')}
            placeholder="Amount (USD)"
            showFeedback={touched.amount}
            valid={!errors.amount}
            blurOnSubmit={false}
            ref={amountInputRef}
            editable={!isLoading}
            autoCapitalize="none"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            inputMode="numeric"
            placeholderTextColor="grey"
            textInputClassName="!text-gray-900"
          />
          <View className="mt-4 h-auto min-h-[1.25rem] w-full flex-row">
            <P className="text-red w-full text-center text-sm">
              {(touched.email && errors.email) ||
                (touched.amount && errors.amount) ||
                message}
            </P>
          </View>

          <P className="block py-2 text-sm font-medium text-gray-700">
            USD Amount (${values.amount})
          </P>

          <P className="block py-2 text-sm font-medium text-gray-700">
            Processing Fee: ${getFee(values.amount).toFixed(2)}
          </P>

          <P className="block py-2 text-sm font-medium text-gray-700">
            Estimated HITZ: {getEstimatedHITZ(values.amount) !== null 
              ? `~${getEstimatedHITZ(values.amount)?.toFixed(0)} HITZ` 
              : 'Loading...'}
          </P>

          <P className="block py-1 text-xs text-gray-500">
            (USD → HITZ via Soroswap DEX)
          </P>

          <P className="block py-2 text-sm font-bold text-gray-700">
            +1.5% International fee for non-USD cards.
          </P>

          {Platform.OS === 'web' && (
            <PaymentElement
              id="payment-element"
              className="mt-4"
              options={paymentElementOptions}
            />
          )}

          <Button
            wrapperClassName="w-full my-4"
            className="text-center bg-primary hover:bg-primary-dark"
            disabled={
              isLoading ||
              !stripe ||
              !elements ||
              !!errors.amount ||
              !!errors.email
            }
            onPress={() => handleSubmit()}
          >
            {isLoading ? 'Loading...' : 'Top Up'}
          </Button>
        </View>
      )}
    </Formik>
  )
}
