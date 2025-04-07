import { TextInput, TextInputProps, View } from 'react-native'
import React, { ForwardedRef } from 'react'
import Check from 'app/ui/icons/check'
import Close from 'app/ui/icons/close'

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
  ref: ForwardedRef<TextInput>,
) {
  return (
    <View
      className={'flex h-12 w-full flex-row items-center rounded-lg bg-gray-700/20 p-2 '.concat(
        className ?? '',
      )}
    >
      <TextInput
        placeholderTextColor={
          rest.placeholderTextColor ? rest.placeholderTextColor : 'white'
        }
        autoCapitalize="none"
        className={`remove-font-padding grow text-sm leading-none text-white outline-none ${textInputClassName}`}
        value={value}
        {...rest}
        ref={ref}
      />
      {showFeedback &&
        (valid ? (
          <Check className="text-green w-4" />
        ) : (
          <Close className="text-red w-4" />
        ))}
    </View>
  )
})

export default StyledTextInput
