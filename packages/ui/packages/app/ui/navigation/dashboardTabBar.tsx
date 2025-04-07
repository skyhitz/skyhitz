import { View, StyleProp, ViewStyle } from 'react-native'
import { useCallback } from 'react'
import { Link } from 'solito/link'
import Search from 'app/ui/icons/search'
import User from 'app/ui/icons/user'
import { useUserAtomState } from 'app/state/user'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { SkyhitzLogo } from '../logo'

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
  const isActive = useCallback(
    (tabName: string): boolean => {
      return currentTabName === tabName
    },
    [currentTabName],
  )

  const insets = useSafeArea()
  const { user } = useUserAtomState()
  const rootViewStyle = column ? 'flex-col' : 'flex-row border-t-2 border-white'

  return (
    <View
      className={`flex ${rootViewStyle} pb-[${insets.bottom}px] ${className}`}
    >
      <Link viewProps={{ style: LinkStyle }} href="/dashboard/search">
        <Search
          size={28}
          className={isActive('search') ? 'text-blue' : 'text-gray-600'}
        />
      </Link>
      <Link viewProps={{ style: LinkStyle }} href="/dashboard/chart">
        <View
          className={
            isActive('chart')
              ? 'border-blue flex h-8 w-8 items-center justify-center rounded-full border-2 pb-1'
              : 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 pb-1'
          }
        >
          <SkyhitzLogo size={20} id={`dashboard${column}`} />
        </View>
      </Link>
      {user && (
        <Link viewProps={{ style: LinkStyle }} href="/dashboard/profile">
          <User
            size={28}
            className={isActive('profile') ? 'text-blue' : 'text-gray-600'}
          />
        </Link>
      )}
    </View>
  )
}
