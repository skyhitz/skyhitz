'use client'
import { ReactNode, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import ChevronDown from 'app/ui/icons/chevron-down'
import ChevronUp from 'app/ui/icons/chevron-up'
import { AnimateHeight } from './animate-height'

type Props = {
  initCollapsed?: boolean
  children?: ReactNode
  icon?: React.ComponentType<any>
  headerText: string
  className?: string
}

export const CollapsableView = ({
  children,
  initCollapsed = false,
  headerText,
  icon: Icon,
  className,
}: Props) => {
  const [collapsed, setCollapsed] = useState<boolean>(initCollapsed)

  return (
    <View
      className={`mt-8 w-full overflow-hidden rounded-lg border border-gray-800 ${
        className ?? ''
      }`}
    >
      <Pressable
        onPress={() => {
          setCollapsed(!collapsed)
        }}
      >
        <View className="flex flex-row items-center p-5">
          {Icon && <Icon size={18} className="text-gray-400" />}
          <Text className="mx-2 flex-1 font-semibold text-gray-400">
            {headerText}
          </Text>

          {collapsed ? (
            <ChevronDown size={18} className="text-gray-400" />
          ) : (
            <ChevronUp size={18} className="text-gray-400" />
          )}
        </View>
      </Pressable>

      <AnimateHeight hide={collapsed}>
        <View className={'overflow-hidden text-gray-400'}>
          {children}
        </View>
      </AnimateHeight>
    </View>
  )
}
