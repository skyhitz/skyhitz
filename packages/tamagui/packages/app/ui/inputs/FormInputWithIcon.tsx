'use client'
import * as React from 'react'
import { TextInput, TextInputProps } from 'react-native'
import { useField, FieldHookConfig } from 'formik'
import { YStack, XStack, Input, Text, styled } from 'tamagui'

type FormInputWithIconProps = TextInputProps & {
  name?: string
  label?: string
  icon?: React.ReactNode
  className?: string
  inputClassName?: string
  error?: string
  value?: string
  onChangeText?: (text: string) => void
  onBlur?: (e: any) => void
}

const StyledInput = styled(Input, {
  flex: 1,
  borderRadius: '$3',
  paddingVertical: '$3',
  paddingHorizontal: '$3',
  backgroundColor: '$background',
  borderColor: '$borderColor',
  color: '$color12',
  focusStyle: {
    borderColor: '$blue9',
  },
  variants: {
    hasError: {
      true: {
        borderColor: '$red9',
      },
    },
    hasIcon: {
      true: {
        paddingLeft: '$10',
      },
    },
  },
})

export function FormInputWithIcon({
  name,
  label,
  icon,
  className = '',
  inputClassName = '',
  error: propError,
  ...props
}: FormInputWithIconProps) {
  // Handle both direct error prop and Formik integration
  const formikProps = name ? useField(name) : []
  const [field, meta, helpers] = formikProps as any

  // Use either direct error prop or formik error
  const hasError = propError || (meta?.touched && meta?.error)
  const errorMessage = propError || (meta?.touched ? meta?.error : undefined)

  return (
    <YStack marginBottom="$4" className={className}>
      {label && (
        <Text
          marginBottom="$1"
          fontSize="$3"
          fontWeight="500"
          color="$gray10"
        >
          {label}
        </Text>
      )}

      <XStack
        position="relative"
        flexDirection="row"
        alignItems="center"
        borderRadius="$3"
        borderWidth={1}
        backgroundColor="$background"
        borderColor={hasError ? '$red9' : '$borderColor'}
        focusWithinStyle={{ borderColor: '$blue9' }}
      >
        {icon && (
          <YStack
            position="absolute"
            left="$3"
            zIndex={10}
          >
            {icon}
          </YStack>
        )}

        <StyledInput
          value={field?.value !== undefined ? field.value : props.value}
          onChangeText={helpers?.setValue || props.onChangeText}
          onBlur={field ? () => helpers.setTouched(true) : props.onBlur}
          placeholderTextColor="$gray9"
          hasError={hasError}
          hasIcon={!!icon}
          className={inputClassName}
          {...props}
        />
      </XStack>

      {hasError && (
        <Text
          marginTop="$1"
          fontSize="$2"
          color="$red9"
        >
          {errorMessage}
        </Text>
      )}
    </YStack>
  )
}
