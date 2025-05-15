'use client'
import { View, StyleProp, ViewStyle, Pressable } from 'react-native'
import { useCallback } from 'react'
import Search from 'app/ui/icons/search'
import { useUserStore } from 'app/state/user'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import User from 'app/ui/icons/user'
import { SkyhitzLogo } from 'app/ui/logo'
import { ROUTES } from 'app/constants/routes'
import { useAppNavigation, useContentNavigation, useProfileNavigation } from 'app/hooks/navigation'

const LinkStyle: StyleProp<ViewStyle> = {
  flex: 1,
  flexBasis: 0,
  padding: 10,
  alignItems: 'center',
  justifyContent: 'center',
  maxHeight: 64,
}

export default function MainTabBar({
  column,
  currentTabName,
  className,
}: {
  column?: boolean
  currentTabName: string
  className?: string
}) {
  const isActive = useCallback(
    (tabName: string): boolean => {
      return currentTabName === tabName
    },
    [currentTabName]
  )

  const insets = useSafeArea()
  const { user } = useUserStore()
  const rootViewStyle = column ? 'flex-col' : 'flex-row border-t-2 border-white'

  // Get our navigation hooks
  const { isCurrentRoute } = useAppNavigation()
  const { goToSearch, goToChart } = useContentNavigation()
  const { goToMyProfile } = useProfileNavigation()

  return (
    <View
      className={`flex ${rootViewStyle} ${className}`}
      style={{
        paddingBottom: insets.bottom,
        backgroundColor: 'var(--bg-color)',
      }}
    >
      <Pressable style={LinkStyle} onPress={goToSearch}>
        <Search
          size={28}
          color={
            isActive('search')
              ? 'var(--primary-color)'
              : 'var(--text-secondary-color)'
          }
        />
      </Pressable>

      <Pressable style={LinkStyle} onPress={goToChart}>
        <View
          style={{
            borderColor: isActive('chart')
              ? 'var(--primary-color)'
              : 'var(--text-secondary-color)',
            borderWidth: 2,
            borderRadius: 9999,
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 0,
          }}
        >
          <SkyhitzLogo size={20} id={`main-nav-${column ? 'column' : 'row'}`} />
        </View>
      </Pressable>

      {user && (
        <Pressable style={LinkStyle} onPress={goToMyProfile}>
          <User
            size={28}
            color={
              isActive('profile')
                ? 'var(--primary-color)'
                : 'var(--text-secondary-color)'
            }
          />
        </Pressable>
      )}
    </View>
  )
}
