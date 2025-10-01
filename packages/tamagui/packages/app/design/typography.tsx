import { ComponentProps } from 'react'
import { Text as TamaguiText, H1 as TamaguiH1, H2 as TamaguiH2, H3 as TamaguiH3, Spinner } from 'tamagui'
import { Pressable, ActivityIndicator as NativeActivityIndicator } from 'react-native'
import { TextLink } from 'solito/link'

/**
 * Basic text component with default styles
 */
export function P({
  children,
  ...rest
}: ComponentProps<typeof TamaguiText>) {
  return (
    <TamaguiText
      fontSize="$4"
      color="$color"
      {...rest}
    >
      {children}
    </TamaguiText>
  )
}

/**
 * H1 heading component
 */
export function H1({
  children,
  ...rest
}: ComponentProps<typeof TamaguiH1>) {
  return (
    <TamaguiH1
      fontSize="$10"
      fontWeight="800"
      color="$color"
      marginVertical="$4"
      {...rest}
    >
      {children}
    </TamaguiH1>
  )
}

/**
 * H2 heading component
 */
export function H2({
  children,
  ...rest
}: ComponentProps<typeof TamaguiH2>) {
  return (
    <TamaguiH2
      fontSize="$8"
      fontWeight="800"
      color="$color"
      {...rest}
    >
      {children}
    </TamaguiH2>
  )
}

/**
 * H3 heading component
 */
export function H3({
  children,
  ...rest
}: ComponentProps<typeof TamaguiH3>) {
  return (
    <TamaguiH3
      fontSize="$6"
      fontWeight="800"
      color="$color"
      {...rest}
    >
      {children}
    </TamaguiH3>
  )
}

/**
 * Activity Indicator (Spinner)
 */
export function ActivityIndicator({ size = 'small', color }: { size?: 'small' | 'large', color?: string }) {
  return <Spinner size={size} color={color || '$color'} />
}

/**
 * Link component props
 */
export interface AProps {
  href?: string
  target?: '_blank'
  variant?: string
  children: React.ReactNode
  className?: string
}

/**
 * Link component with Tamagui styling
 */
export function A({
  href = '',
  children,
  target,
  variant,
  ...rest
}: AProps) {
  if (variant === 'button') {
    return (
      <TextLink href={href} target={target}>
        <Pressable>
          <TamaguiText
            color="$blue9"
            fontWeight="600"
            paddingHorizontal="$5"
            paddingVertical="$3"
            backgroundColor="$blue9"
            color="$white1"
            borderRadius="$3"
            textAlign="center"
            hoverStyle={{ backgroundColor: '$blue10' }}
            pressStyle={{ opacity: 0.8 }}
            {...rest}
          >
            {children}
          </TamaguiText>
        </Pressable>
      </TextLink>
    )
  }

  return (
    <TextLink href={href} target={target}>
      <TamaguiText
        color="$blue9"
        textDecorationLine="underline"
        hoverStyle={{ color: '$blue10' }}
        {...rest}
      >
        {children}
      </TamaguiText>
    </TextLink>
  )
}
