'use client'
import { YStack, XStack } from 'tamagui'
import { useMemo } from 'react'
import { usePathname } from 'app/navigation'
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
    <YStack height="100dvh" flex={1} overflow="hidden" backgroundColor="$background">
      {/* Top Navigation - hidden on mobile */}
      <Navbar display={{ xs: 'none', md: 'flex' }} />

      <XStack flex={1} flexDirection="row">
        {/* Side Navigation - hidden on mobile - always show regardless of login status */}
        <MainTabBar
          display={{ xs: 'none', md: 'flex' }}
          currentTabName={currentTabName}
          column
        />

        {/* Main Content */}
        <YStack flex={1} overflow="auto">{children}</YStack>
      </XStack>

      {/* Bottom Navigation - visible only on mobile */}
      <MobileTabBarWrapper />
    </YStack>
  )
}
