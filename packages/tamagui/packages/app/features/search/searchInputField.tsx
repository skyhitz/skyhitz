'use client'
import { TextInput } from 'react-native'
import { Search, X } from '@tamagui/lucide-icons'
import { XStack, Input, Button } from 'tamagui'

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
    <XStack
      width="100%"
      flexDirection="row"
      alignItems="center"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$background"
      paddingHorizontal="$2"
      paddingVertical="$1"
    >
      <Search
        size={20}
        color="$gray10"
        marginRight="$2"
      />
      <Input
        flex={1}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        fontSize="$3"
        color="$color12"
        paddingVertical="$1"
        backgroundColor="transparent"
        borderWidth={0}
        outlineStyle="none"
        autoCapitalize={autoCapitalize}
      />
      {showX && (
        <Button
          onPress={onXClick}
          backgroundColor="transparent"
          padding="$1"
          marginLeft="$2"
          hitSlop={8}
        >
          <X
            size={20}
            color="$gray10"
          />
        </Button>
      )}
    </XStack>
  )
}
