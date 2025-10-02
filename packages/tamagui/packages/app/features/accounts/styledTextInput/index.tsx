'use client'
import { XStack, Input, Circle, GetProps } from 'tamagui'
import React, { ForwardedRef } from 'react'

// Simple check/close icons using Tamagui Circle
const Check = () => (
  <Circle size={16} backgroundColor="$green9" />
)

const Close = () => (
  <Circle size={16} backgroundColor="$red9" />
)

type StyledInputProps = GetProps<typeof Input> & {
  valid?: boolean
  showFeedback?: boolean
}

const StyledTextInput = React.forwardRef(function StyledTextInput(
  {
    valid,
    value,
    showFeedback,
    ...rest
  }: StyledInputProps,
  ref: ForwardedRef<any>,
) {
  return (
    <XStack
      height={48}
      width="100%"
      flexDirection="row"
      alignItems="center"
      borderRadius="$3"
      backgroundColor="$gray7"
      opacity={0.2}
      padding="$2"
    >
      <Input
        placeholderTextColor="$white1"
        autoCapitalize="none"
        flexGrow={1}
        fontSize="$3"
        lineHeight="$1"
        color="$white1"
        borderWidth={0}
        backgroundColor="transparent"
        value={value}
        {...rest}
        ref={ref}
      />
      {showFeedback &&
        (valid ? (
          <Check />
        ) : (
          <Close />
        ))}
    </XStack>
  )
})

export default StyledTextInput
