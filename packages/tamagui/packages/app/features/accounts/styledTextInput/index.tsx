'use client'
import { TextInput, TextInputProps, View } from 'react-native'
import React, { ForwardedRef } from 'react'

// We'll create simplified check/close icons for now
const Check = ({ className }: { className?: string }) => (
  <View className={`h-4 w-4 rounded-full bg-green-500 ${className}`} />
)

const Close = ({ className }: { className?: string }) => (
  <View className={`h-4 w-4 rounded-full bg-red-500 ${className}`} />
)

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
