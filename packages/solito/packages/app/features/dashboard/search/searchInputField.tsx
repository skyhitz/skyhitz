'use client'
import { TextInput, TextInputProps, View, Pressable } from 'react-native'
import { X } from 'app/ui/icons/x'
import Search from 'app/ui/icons/search'

type SearchInputFieldProps = TextInputProps & {
  showX?: boolean
  onXClick?: () => void
}

export function SearchInputField({
  showX,
  onXClick,
  ...rest
}: SearchInputFieldProps) {
  return (
    <View className="flex flex-row items-center rounded-lg bg-gray-800 p-3">
      <Search className="mr-2 h-5 w-5 text-gray-400" />
      <TextInput
        className="remove-font-padding flex-1 text-base text-white"
        placeholderTextColor="#71717a"
        placeholder="Search for Music or Collectors"
        {...rest}
      />
      {showX && (
        <Pressable onPress={onXClick}>
          <X className="ml-2 h-5 w-5 text-gray-400" />
        </Pressable>
      )}
    </View>
  )
}
