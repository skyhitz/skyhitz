'use client'
import * as React from 'react'
import { TextInput, View, Text, TextInputProps } from 'react-native'
import { useField, FieldHookConfig } from 'formik'

type FormInputWithIconProps = TextInputProps & {
  name: string
  label?: string
  icon?: React.ReactNode
  className?: string
  inputClassName?: string
}

export function FormInputWithIcon({
  name,
  label,
  icon,
  className = '',
  inputClassName = '',
  ...props
}: FormInputWithIconProps) {
  const [field, meta, helpers] = useField(name as FieldHookConfig<string>)

  const hasError = meta.touched && meta.error

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="mb-1 text-sm font-medium text-gray-300">{label}</Text>
      )}
      
      <View className="relative flex flex-row items-center rounded-lg border bg-gray-900 focus-within:border-blue-500">
        {icon && (
          <View className="absolute left-3 z-10">
            {icon}
          </View>
        )}
        
        <TextInput
          value={field.value}
          onChangeText={helpers.setValue}
          onBlur={() => helpers.setTouched(true)}
          placeholderTextColor="#6b7280"
          className={`flex-1 rounded-lg py-3 px-3 text-white ${
            icon ? 'pl-10' : 'pl-3'
          } ${inputClassName} ${hasError ? 'border-red-500' : ''}`}
          {...props}
        />
      </View>
      
      {hasError && (
        <Text className="mt-1 text-xs text-red-500">{meta.error}</Text>
      )}
    </View>
  )
}
