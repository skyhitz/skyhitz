'use client'
import { ReactNode, useState } from 'react'
import ChevronDown from 'app/ui/icons/chevron-down'
import ChevronUp from 'app/ui/icons/chevron-up'
import { AnimateHeight } from './animate-height'
import { YStack, XStack, Text } from 'tamagui'

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
    <YStack
      marginTop="$8"
      width="100%"
      overflow="hidden"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      className={className}
    >
      <XStack
        flexDirection="row"
        alignItems="center"
        padding="$5"
        pressStyle={{ opacity: 0.8 }}
        onPress={() => {
          setCollapsed(!collapsed)
        }}
        cursor="pointer"
      >
        {Icon && <Icon size={18} color="$gray10" />}
        <Text
          marginHorizontal="$2"
          flex={1}
          fontWeight="600"
          color="$gray10"
        >
          {headerText}
        </Text>

        {collapsed ? (
          <ChevronDown size={18} color="$gray10" />
        ) : (
          <ChevronUp size={18} color="$gray10" />
        )}
      </XStack>

      <AnimateHeight hide={collapsed}>
        <YStack overflow="hidden" color="$gray10">{children}</YStack>
      </AnimateHeight>
    </YStack>
  )
}
