import { createNativeStackNavigator } from '@react-navigation/native-stack'

import HomeProvider from 'app/features/home/provider'
import { UserDetailScreen } from 'app/features/user/detail-screen'
import { SignIn } from 'app/features/accounts/sign-in'
import { SignUp } from 'app/features/accounts/sign-up'
import DashboardScreen from 'app/features/dashboard'

const Stack = createNativeStackNavigator<{
  home: undefined
  'user-detail': {
    id: string
  }
  'sign-in': undefined
  'sign-up': undefined
  dashboard: undefined
}>()

export function NativeNavigation() {
  return (
    <Stack.Navigator initialRouteName="home">
      <Stack.Screen
        name="home"
        component={HomeProvider}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="user-detail"
        component={UserDetailScreen}
        options={{
          title: 'User',
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
        name="dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  )
}
