'use client'
import { View, StyleProp, ViewStyle, Pressable } from 'react-native'
import { useCallback } from 'react'
import { Link } from 'solito/link'
import Search from 'app/ui/icons/search'
import { useUserStore } from 'app/state/user'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { P } from 'app/design/typography'
import { useTheme } from 'app/state/theme/useTheme'
import User from 'app/ui/icons/user'
import { SkyhitzLogo } from 'app/ui/logo'

const LinkStyle: StyleProp<ViewStyle> = {
  flex: 1,
  flexBasis: 0,
  padding: 10,
  alignItems: 'center',
  justifyContent: 'center',
  maxHeight: 64,
}

export default function DashboardTabBar({
  column,
  currentTabName,
  className,
}: {
  column?: boolean
  currentTabName: string
  className?: string
}) {
  const { isDark } = useTheme()

  const isActive = useCallback(
    (tabName: string): boolean => {
      return currentTabName === tabName
    },
    [currentTabName]
  )

  const insets = useSafeArea()
  const { user } = useUserStore()
  const rootViewStyle = column ? 'flex-col' : 'flex-row border-t-2 border-white'

  const activeColor = 'var(--primary-color)'
  const inactiveColor = 'var(--text-secondary-color)'

  return (
    <View
      className={`flex ${rootViewStyle} ${className}`}
      style={{
        paddingBottom: insets.bottom,
        backgroundColor: 'var(--bg-color)',
      }}
    >
      <Link href="/dashboard/search" viewProps={{ style: LinkStyle }}>
        <Search
          width="28"
          height="28"
          className={`stroke-[${isActive('search') ? '--primary-color' : '--text-secondary-color'}]`}
        />
      </Link>

      <Link href="/dashboard/chart" viewProps={{ style: LinkStyle }}>
        <View
          style={{
            borderColor: isActive('chart') ? 'var(--primary-color)' : 'var(--text-secondary-color)',
            borderWidth: 2,
            borderRadius: 9999,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 0,
          }}
        >
          <SkyhitzLogo size={20} id={`dashboard${column ? 'column' : 'row'}`} />
        </View>
      </Link>

      {user && (
        <Link href="/dashboard/profile" viewProps={{ style: LinkStyle }}>
          <User
            width="28"
            height="28"
            className={`stroke-[${isActive('profile') ? '--primary-color' : '--text-secondary-color'}]`}
          />
        </Link>
      )}
    </View>
  )
}
