'use client'
import * as React from 'react'
import { 
  Text as TamaguiText, 
  H1 as TamaguiH1, 
  H2 as TamaguiH2, 
  H3 as TamaguiH3, 
  H4 as TamaguiH4,
  Paragraph as TamaguiParagraph,
  Spinner,
  styled,
  GetProps
} from 'tamagui'

// Basic text component with default styling
export function Text(props: GetProps<typeof TamaguiText>) {
  return (
    <TamaguiText fontSize="$4" {...props} />
  )
}

// Paragraph component
export function P(props: GetProps<typeof TamaguiParagraph>) {
  return (
    <TamaguiParagraph fontSize="$4" lineHeight="$5" {...props} />
  )
}

// Heading 1 component
export function H1(props: GetProps<typeof TamaguiH1>) {
  return (
    <TamaguiH1 fontSize="$9" fontWeight="bold" {...props} />
  )
}

// Heading 2 component
export function H2(props: GetProps<typeof TamaguiH2>) {
  return (
    <TamaguiH2 fontSize="$8" fontWeight="bold" {...props} />
  )
}

// Heading 3 component
export function H3(props: GetProps<typeof TamaguiH3>) {
  return (
    <TamaguiH3 fontSize="$6" fontWeight="bold" {...props} />
  )
}

// Heading 4 component
export function H4(props: GetProps<typeof TamaguiH4>) {
  return (
    <TamaguiH4 fontSize="$5" fontWeight="bold" {...props} />
  )
}

// Activity indicator with theming
export function ActivityIndicator({ 
  size = 'small',
  color = '$color',
  ...props
}: { size?: 'small' | 'large'; color?: string }) {
  return <Spinner size={size} color={color} {...props} />
}

// Small Text component
export const Small = styled(TamaguiText, {
  fontSize: '$3',
})

// Label component
export const Label = styled(TamaguiText, {
  fontSize: '$3',
  fontWeight: '500',
})

// Caption component
export const Caption = styled(TamaguiText, {
  fontSize: '$2',
  color: '$gray10',
})

// Anchor/Link component
export const A = styled(TamaguiText, {
  name: 'A',
  tag: 'a',
  cursor: 'pointer',
  textDecorationLine: 'underline',
  hoverStyle: {
    opacity: 0.8,
  },
})
