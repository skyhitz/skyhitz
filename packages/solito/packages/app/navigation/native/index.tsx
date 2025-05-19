import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { SignIn } from 'app/features/accounts/sign-in'
import { SignUp } from 'app/features/accounts/sign-up'
import { HomeScreen } from 'app/features/home/screen'
import { BlogScreenNative } from 'app/features/blog'
import { PostScreenNative } from 'app/features/post/index.native'
// import { ChartScreen } from 'app/features/chart'

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
        component={HomeScreen}
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
        component={HomeScreen}
        options={{
          title: 'Beat',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        component={HomeScreen}
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/likes"
        component={HomeScreen}
        options={{
          title: 'Likes',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/collection"
        component={HomeScreen}
        options={{
          title: 'Collection',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile/edit"
        component={HomeScreen}
        options={{
          title: 'Edit Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="search"
        component={HomeScreen}
        options={{
          title: 'Search',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
