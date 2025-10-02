'use client'

import { useState, useEffect } from 'react'
import { useStripe } from '@stripe/react-stripe-js'
import { YStack, XStack } from 'tamagui'
import { P } from 'app/design/typography'

const SuccessIcon = (
  <svg
    width="16"
    height="14"
    viewBox="0 0 16 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.4695 0.232963C15.8241 0.561287 15.8454 1.1149 15.5171 1.46949L6.14206 11.5945C5.97228 11.7778 5.73221 11.8799 5.48237 11.8748C5.23253 11.8698 4.99677 11.7582 4.83452 11.5681L0.459523 6.44311C0.145767 6.07557 0.18937 5.52327 0.556912 5.20951C0.924454 4.89575 1.47676 4.93936 1.79051 5.3069L5.52658 9.68343L14.233 0.280522C14.5613 -0.0740672 15.1149 -0.0953599 15.4695 0.232963Z"
      fill="white"
    />
  </svg>
)

const ErrorIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.25628 1.25628C1.59799 0.914573 2.15201 0.914573 2.49372 1.25628L8 6.76256L13.5063 1.25628C13.848 0.914573 14.402 0.914573 14.7437 1.25628C15.0854 1.59799 15.0854 2.15201 14.7437 2.49372L9.23744 8L14.7437 13.5063C15.0854 13.848 15.0854 14.402 14.7437 14.7437C14.402 15.0854 13.848 15.0854 13.5063 14.7437L8 9.23744L2.49372 14.7437C2.15201 15.0854 1.59799 15.0854 1.25628 14.7437C0.914573 14.402 0.914573 13.848 1.25628 13.5063L6.76256 8L1.25628 2.49372C0.914573 2.15201 0.914573 1.59799 1.25628 1.25628Z"
      fill="white"
    />
  </svg>
)

const InfoIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 1.5H4C2.61929 1.5 1.5 2.61929 1.5 4V10C1.5 11.3807 2.61929 12.5 4 12.5H10C11.3807 12.5 12.5 11.3807 12.5 10V4C12.5 2.61929 11.3807 1.5 10 1.5ZM4 0C1.79086 0 0 1.79086 0 4V10C0 12.2091 1.79086 14 4 14H10C12.2091 14 14 12.2091 14 10V4C14 1.79086 12.2091 0 10 0H4Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7 10.5C7.41421 10.5 7.75 10.1642 7.75 9.75V6.75C7.75 6.33579 7.41421 6 7 6C6.58579 6 6.25 6.33579 6.25 6.75V9.75C6.25 10.1642 6.58579 10.5 7 10.5Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.75 4C7.75 3.58579 7.41421 3.25 7 3.25C6.58579 3.25 6.25 3.58579 6.25 4C6.25 4.41421 6.58579 4.75 7 4.75C7.41421 4.75 7.75 4.41421 7.75 4Z"
      fill="white"
    />
  </svg>
)

const STATUS_CONTENT_MAP: Record<string, any> = {
  default: {
    text: 'Payment status',
    icon: InfoIcon,
    iconColor: '#3944BC',
  },
  succeeded: {
    text: 'Payment successful',
    icon: SuccessIcon,
    iconColor: '#00AB3B',
  },
  processing: {
    text: 'Your payment is processing',
    icon: InfoIcon,
    iconColor: '#3944BC',
  },
  requires_payment_method: {
    text: 'Payment failed',
    icon: ErrorIcon,
    iconColor: '#BC150C',
  },
  requires_action: {
    text: 'Action required',
    icon: InfoIcon,
    iconColor: '#3944BC',
  },
  canceled: {
    text: 'Payment canceled',
    icon: ErrorIcon,
    iconColor: '#BC150C',
  },
}

export default function CompletePage() {
  const stripe = useStripe()

  const [status, setStatus] = useState('default')
  const [intentId, setIntentId] = useState<string | null>(null)

  useEffect(() => {
    if (!stripe || typeof window === 'undefined') {
      return
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret',
    )

    if (!clientSecret) {
      return
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        return
      }

      setStatus(paymentIntent.status)
      setIntentId(paymentIntent.id)
    })
  }, [stripe])

  return (
    <YStack 
      padding="$5"
      backgroundColor="$white1"
      borderRadius="$3"
      maxWidth={448}
      marginHorizontal="auto"
      marginVertical="$8"
    >
      <YStack 
        width={48}
        height={48}
        borderRadius={24}
        justifyContent="center"
        alignItems="center"
        marginBottom="$4"
        marginHorizontal="auto"
        backgroundColor={STATUS_CONTENT_MAP[status].iconColor}
      >
        {STATUS_CONTENT_MAP[status].icon}
      </YStack>
      <P 
        textAlign="center"
        marginBottom="$5"
        fontWeight="bold"
        fontSize="$4"
      >
        {STATUS_CONTENT_MAP[status].text}
      </P>
      {intentId && (
        <YStack marginTop="$5" borderTopWidth={1} borderTopColor="$gray5" paddingTop="$4">
          <XStack flexDirection="row" marginBottom="$2">
            <P fontWeight="bold" width={80}>ID:</P>
            <P flex={1}>{intentId}</P>
          </XStack>
          <XStack flexDirection="row">
            <P fontWeight="bold" width={80}>Status:</P>
            <P flex={1}>{status}</P>
          </XStack>
        </YStack>
      )}
    </YStack>
  )
}
