import { NavigationContainer } from '@react-navigation/native'
import * as Linking from 'expo-linking'
import { useMemo } from 'react'

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NavigationContainer
      linking={useMemo(
        () => ({
          prefixes: [Linking.createURL('/')],
          config: {
            initialRouteName: 'home',
            screens: {
              home: '',
              'user-detail': 'users/:id',
              'sign-in': 'sign-in',
              'sign-up': 'sign-up',
              'chart': 'chart',
              'beat': 'beat/:id',
              'profile': 'profile',
              'profile/likes': 'profile/likes',
              'profile/collection': 'profile/collection',
              'profile/edit': 'profile/edit',
              'search': 'search',
            },
          },
        }),
        []
      )}
    >
      {children}
    </NavigationContainer>
  )
}
