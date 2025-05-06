'use client'
import { View } from 'react-native'
import { useMemo } from 'react'
import { useUserStore } from 'app/state/user'
import { usePathname } from 'solito/navigation'
import DashboardTabBar from './DashboardTabBar'
import { MobileTabBarWrapper } from './MobileTabBarWrapper'
import { useTheme } from 'app/state/theme/useTheme'
import { Navbar } from '../navbar/Navbar'

export function DashboardNavigation({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const route = pathname || ''
  const currentTabName = useMemo(() => route.split('/').at(-1) || '', [route])
  const { user } = useUserStore()
  const { colors } = useTheme()

  return (
    <View className="flex h-[100dvh] flex-1 overflow-hidden" style={{ backgroundColor: colors.background }}>
      {/* Top Navigation - hidden on mobile */}
      <Navbar className="hidden md:flex" />

      <View className="flex flex-1 flex-row" style={{ backgroundColor: colors.background }}>
        {/* Side Navigation - hidden on mobile - always show regardless of login status */}
        <DashboardTabBar
          className="hidden md:flex"
          currentTabName={currentTabName}
          column
        />
        
        {/* Main Content */}
        <View className="flex-1 overflow-auto" style={{ backgroundColor: colors.background }}>
          {children}
        </View>
      </View>

      {/* Bottom Navigation - visible only on mobile */}
      <MobileTabBarWrapper currentTabName={currentTabName} />
    </View>
  )
}
