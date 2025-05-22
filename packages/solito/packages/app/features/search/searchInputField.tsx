'use client'
import { TextInput, Pressable, View } from 'react-native'
import Search from 'app/ui/icons/search'
import { X } from 'app/ui/icons/x'

type SearchInputFieldProps = {
  value: string
  onChangeText: (text: string) => void
  showX?: boolean
  onXClick?: () => void
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  placeholder?: string
}

export function SearchInputField({
  value,
  onChangeText,
  showX,
  onXClick,
  autoCapitalize,
  placeholder = 'Search for Music or Collectors',
}: SearchInputFieldProps) {
  return (
    <View className="flex w-full flex-row items-center rounded-lg border border-[--border-color] bg-[--card-bg-color] px-2 py-1">
      <Search
        width={20}
        height={20}
        className="mr-2 stroke-[--text-secondary-color]"
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className="remove-font-padding flex-1 text-sm text-[--text-color] py-1"
        autoCapitalize={autoCapitalize}
        // @ts-ignore - outlineStyle works on web but isn't in the type definitions
        style={{ outlineStyle: 'none' }}
      />
      {showX && (
        <Pressable onPress={onXClick} hitSlop={8}>
          <X
            width={20}
            height={20}
            className="ml-2 stroke-[--text-secondary-color]"
          />
        </Pressable>
      )}
    </View>
  )
}
