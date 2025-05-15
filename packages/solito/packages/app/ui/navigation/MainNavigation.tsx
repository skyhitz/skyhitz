'use client'
import { View } from 'react-native'
import { useMemo } from 'react'
import { usePathname } from 'solito/navigation'
import MainTabBar from 'app/ui/navigation/MainTabBar'
import { MobileTabBarWrapper } from './MobileTabBarWrapper'
import { Navbar } from '../navbar/Navbar'

export function MainNavigation({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const route = pathname || ''
  const currentTabName = useMemo(() => route.split('/').at(-1) || '', [route])

  return (
    <View className="flex h-[100dvh] flex-1 overflow-hidden bg-[--bg-color]">
      {/* Top Navigation - hidden on mobile */}
      <Navbar className="hidden md:flex" />

      <View className="flex flex-1 flex-row">
        {/* Side Navigation - hidden on mobile - always show regardless of login status */}
        <MainTabBar
          className="hidden md:flex"
          currentTabName={currentTabName}
          column
        />

        {/* Main Content */}
        <View className="flex-1 overflow-auto">{children}</View>
      </View>

      {/* Bottom Navigation - visible only on mobile */}
      <MobileTabBarWrapper />
    </View>
  )
}
