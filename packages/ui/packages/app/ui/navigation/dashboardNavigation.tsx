import { View } from 'react-native'
import Navbar from 'app/ui/navbar'
import DashboardTabBar from 'app/ui/navigation/dashboardTabBar'
import React, { useMemo } from 'react'
import { MobileTabBarWrapper } from './mobileTabBarWrapper'
import { useUserAtomState } from 'app/state/user'
import { usePathname } from 'solito/navigation'

export function DashboardNavigation({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const route = pathname || ''
  const currentTabName = useMemo(() => route.split('/').at(-1) || '', [route])
  const { user } = useUserAtomState()

  return (
    <View className="flex h-[calc(100dvh)] flex-1 overflow-hidden">
      <Navbar className="hidden md:flex" />

      <View className="flex flex-1 flex-row">
        {!!user ? (
          <DashboardTabBar
            className="hidden md:flex"
            currentTabName={currentTabName}
            column
          />
        ) : null}
        {children}
      </View>

      <MobileTabBarWrapper currentTabName={currentTabName} />
    </View>
  )
}
