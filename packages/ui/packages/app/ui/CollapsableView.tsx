import { IconProps } from 'app/types'
import { ReactNode, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import ChevronDown from 'app/ui/icons/chevron-down'
import ChevronUp from 'app/ui/icons/chevron-up'
import { AnimateHeight } from './animate-height'

type Props = {
  initCollapsed?: boolean
  children?: ReactNode
  icon?: (_: IconProps) => ReactNode
  headerText: string
  className?: string
}

const iconStyle: IconProps = {
  size: 18,
  className: 'text-gray-600',
}

export const CollapsableView = ({
  children,
  initCollapsed,
  headerText,
  icon,
  className,
}: Props) => {
  const [collapsed, setCollapsed] = useState<boolean>(initCollapsed === true)

  return (
    <View
      className={`border-grey-light mt-8 w-full overflow-hidden rounded-lg border-[0.5px] ${
        className ?? ''
      }`}
    >
      <Pressable
        onPress={() => {
          setCollapsed(!collapsed)
        }}
      >
        <View className="flex flex-row items-center p-5">
          {icon && icon(iconStyle)}
          <Text className="mx-2 flex-1 font-semibold text-gray-600">
            {headerText}
          </Text>

          {collapsed ? (
            <ChevronDown {...iconStyle} />
          ) : (
            <ChevronUp {...iconStyle} />
          )}
        </View>
      </Pressable>

      <AnimateHeight hide={collapsed}>
        <View className={'border-grey-light overflow-hidden text-gray-600'}>
          {children}
        </View>
      </AnimateHeight>
    </View>
  )
}
