import { ReactElement } from 'react'
import { Text, View, TextInputProps, TextInput } from 'react-native'
import { IconProps } from 'app/types'
import { theme } from 'app/design/tailwind/theme'

type Props = {
  icon: (_props: IconProps) => ReactElement
  iconProps?: IconProps
  containerClassNames?: string
  error?: string
  iconPosition?: 'left' | 'right'
}

const defaultIconProps = {
  color: (theme as any)?.colors?.['white']['DEFAULT'],
  size: 22,
}

const defaultRightIconProps = {
  color: (theme as any)?.colors?.['white']['DEFAULT'],
  size: 22,
  className: 'absolute right-0 mr-4',
}

export function FormInputWithIcon({
  style,
  containerClassNames = '',
  placeholderTextColor,
  icon,
  iconProps,
  iconPosition = 'left',
  error,
  ...rest
}: TextInputProps & Props) {
  return (
    <View className={`flex py-5 ${containerClassNames}`}>
      <View className="flex w-full flex-row items-center">
        {iconPosition == 'left' ? icon(iconProps ?? defaultIconProps) : null}
        <TextInput
          className="ml-4 grow font-bold text-gray-600 outline-none"
          style={[style]}
          placeholderTextColor={
            placeholderTextColor ?? (theme as any)?.colors?.['white']['DEFAULT']
          }
          {...rest}
        />
        {iconPosition == 'right' ? icon(defaultRightIconProps) : null}
      </View>
      {error !== undefined && <Text className="text-red mt-3">{error}</Text>}
    </View>
  )
}
