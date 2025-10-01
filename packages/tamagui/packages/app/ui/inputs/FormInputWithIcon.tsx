'use client'
import * as React from 'react'
import { TextInput, View, Text, TextInputProps } from 'react-native'
import { useField, FieldHookConfig } from 'formik'

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
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="mb-1 text-sm font-medium text-gray-300">{label}</Text>
      )}

      <View className="relative flex flex-row items-center rounded-lg border bg-[--bg-color] focus-within:border-[--primary-color]">
        {icon && (
          <View className="absolute left-3 z-10 text-[--text-color]">
            {icon}
          </View>
        )}

        <TextInput
          value={field?.value !== undefined ? field.value : props.value}
          onChangeText={helpers?.setValue || props.onChangeText}
          onBlur={field ? () => helpers.setTouched(true) : props.onBlur}
          placeholderTextColor="#6b7280"
          className={`flex-1 rounded-lg py-3 px-3 text-[--text-color] outline-none ${
            icon ? 'pl-10' : 'pl-3'
          } ${inputClassName} ${hasError ? 'border-red' : ''}`}
          {...props}
        />
      </View>

      {hasError && (
        <Text className="mt-1 text-xs text-red">{errorMessage}</Text>
      )}
    </View>
  )
}
