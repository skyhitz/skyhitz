import { TextInput, TextInputProps } from 'react-native'
import * as React from 'react'
import { Check, X } from '@tamagui/lucide-icons'
import { XStack, Input, GetProps } from 'tamagui'

type StyledInputProps = TextInputProps & GetProps<typeof XStack> & {
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
  ref: React.ForwardedRef<TextInput>,
) {
  return (
    <XStack
      height={48}
      width="100%"
      flexDirection="row"
      alignItems="center"
      borderRadius="$3"
      backgroundColor="$gray8"
      padding="$2"
      {...rest}
    >
      <Input
        flex={1}
        placeholderTextColor={
          rest.placeholderTextColor ? rest.placeholderTextColor : '$white1'
        }
        autoCapitalize="none"
        fontSize="$3"
        lineHeight="$2"
        color="$white1"
        backgroundColor="transparent"
        borderWidth={0}
        outlineStyle="none"
        value={value}
        ref={ref}
      />
      {showFeedback &&
        (valid ? (
          <Check color="$green9" size={16} />
        ) : (
          <X color="$red9" size={16} />
        ))}
    </XStack>
  )
})

export default StyledTextInput
