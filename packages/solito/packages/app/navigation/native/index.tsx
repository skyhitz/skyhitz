import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { SignIn } from 'app/features/accounts/sign-in'
import { SignUp } from 'app/features/accounts/sign-up'
import { BlogScreenNative } from 'app/features/blog/index.native'
import { PostScreenNative } from 'app/features/post/index.native'
import { HomeScreenNative } from 'app/features/home/index.native'
import ChartScreenNative from 'app/features/chart/index.native'

const Stack = createNativeStackNavigator<{
  home: undefined
  'sign-in': undefined
  'sign-up': undefined
  chart: undefined
  beat: {
    id: string
  }
  profile: undefined
  'profile/likes': undefined
  'profile/collection': undefined
  'profile/edit': undefined
  search: undefined
  blog: undefined
  'blog/[slug]': {
    slug: string
  }
}>()

export function NativeNavigation() {
  return (
    <Stack.Navigator initialRouteName="home">
      <Stack.Screen
        name="home"
        component={HomeScreenNative}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sign-in"
        component={SignIn}
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sign-up"
        component={SignUp}
        options={{
          title: 'Sign Up',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chart"
        component={ChartScreenNative}
        options={{
          title: 'Trending',
          headerShown: false,
        }}
      />

      {/* Import and add the other screen components when needed */}
      {/* <Stack.Screen
        name="chart"
        component={ChartScreen}
        options={{
          title: 'Chart',
          headerShown: false,
        }}
      /> */}
      <Stack.Screen
        name="blog"
        component={BlogScreenNative}
        options={{
          title: 'Blog',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="blog/[slug]"
        component={PostScreenNative}
        options={{
          title: 'Blog Post',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="beat"
        component={HomeScreenNative}
        options={{
          title: 'Beat',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        component={HomeScreenNative}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/likes"
        component={HomeScreenNative}
        options={{
          title: 'Likes',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/collection"
        component={HomeScreenNative}
        options={{
          title: 'Collection',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/edit"
        component={HomeScreenNative}
        options={{
          title: 'Edit Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="search"
        component={HomeScreenNative}
        options={{
          title: 'Search',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
