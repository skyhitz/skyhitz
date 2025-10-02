'use client'
import { YStack, XStack, Button, Circle, GetProps } from 'tamagui'
import { useCallback } from 'react'
import { Search, User } from '@tamagui/lucide-icons'
import { useUserStore } from 'app/state/user'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { SkyhitzLogo } from 'app/ui/logo'
import {
  useContentNavigation,
  useProfileNavigation,
} from 'app/hooks/navigation'

const linkProps = {
  flex: 1,
  flexBasis: 0,
  padding: '$2.5',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  maxHeight: 64,
  backgroundColor: 'transparent',
}

export default function MainTabBar({
  column,
  currentTabName,
  ...props
}: {
  column?: boolean
  currentTabName: string
} & GetProps<typeof XStack>) {
  const isActive = useCallback(
    (tabName: string): boolean => {
      return currentTabName === tabName
    },
    [currentTabName]
  )

  const insets = useSafeArea()
  const { user } = useUserStore()
  const Container = column ? YStack : XStack

  // Get our navigation hooks
  const { goToSearch, goToChart } = useContentNavigation()
  const { goToMyProfile } = useProfileNavigation()

  return (
    <Container
      paddingBottom={insets.bottom}
      backgroundColor="$background"
      borderTopWidth={column ? 0 : 2}
      borderColor="$white1"
      {...props}
    >
      <Button {...linkProps} onPress={goToSearch}>
        <Search
          size={28}
          color={isActive('search') ? '$blue9' : '$color11'}
        />
      </Button>

      <Button {...linkProps} onPress={goToChart}>
        <Circle
          size={32}
          borderWidth={2}
          borderColor={isActive('chart') ? '$blue9' : '$color11'}
          alignItems="center"
          justifyContent="center"
        >
          <SkyhitzLogo size={20} id={`main-nav-${column ? 'column' : 'row'}`} />
        </Circle>
      </Button>

      {user && (
        <Button {...linkProps} onPress={goToMyProfile}>
          <User
            size={28}
            color={isActive('profile') ? '$blue9' : '$color11'}
          />
        </Button>
      )}
    </Container>
  )
}
