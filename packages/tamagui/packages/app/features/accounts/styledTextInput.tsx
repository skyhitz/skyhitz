import { TextInput, TextInputProps } from 'react-native'
import * as React from 'react'
import Check from 'app/ui/icons/check'
import Close from 'app/ui/icons/close'
import { XStack, Input } from 'tamagui'

type StyledInputProps = TextInputProps & {
  valid?: boolean
  showFeedback?: boolean
  textInputClassName?: string
}

const StyledTextInput = React.forwardRef(function StyledTextInput(
  {
    className,
    valid,
    value,
    showFeedback,
    textInputClassName,
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
      className={className}
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
        className={textInputClassName}
        {...rest}
        ref={ref}
      />
      {showFeedback &&
        (valid ? (
          <Check color="$green9" width={16} />
        ) : (
          <Close color="$red9" width={16} />
        ))}
    </XStack>
  )
})

export default StyledTextInput
