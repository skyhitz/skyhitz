import React, { ForwardedRef } from 'react'
import { TextInput, TextProps, Pressable, View } from 'react-native'
import Search from 'app/ui/icons/search'
import X from 'app/ui/icons/x'

export const SearchInputField = React.forwardRef(function SearchInputField(
  {
    showX,
    onXClick,
    ...rest
  }: TextProps & { showX?: boolean; onXClick?: () => void },
  ref: ForwardedRef<TextInput>,
) {
  return (
    <View className="flex w-full flex-row items-center rounded-lg border border-gray-200 bg-white px-2 py-1">
      <Search className="text-gray-600" size={20} />
      <TextInput
        placeholder="Search"
        className="mx-1 grow py-1 text-gray-600 outline-none"
        {...rest}
        ref={ref}
      />
      {showX && (
        <Pressable onPress={() => onXClick?.call(null)}>
          <X className="text-gray-600" size={24} />
        </Pressable>
      )}
    </View>
  )
})
