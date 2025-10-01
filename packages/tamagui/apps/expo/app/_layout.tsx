import { Provider } from 'app/provider'
import { Stack } from 'expo-router'

export default function Layout() {
  return (
    <Provider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </Provider>
  )
}
