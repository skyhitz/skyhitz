import 'app/design/global.css'
import { NativeNavigation } from 'app/navigation/native'
import { Provider } from 'app/provider'

import { useFonts, Unbounded_600SemiBold } from '@expo-google-fonts/unbounded'
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_300Light,
  Inter_500Medium,
} from '@expo-google-fonts/inter'
import {
  Raleway_400Regular,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_300Light,
  Raleway_500Medium,
} from '@expo-google-fonts/raleway'

export default function App() {
  const [fontsLoaded] = useFonts({
    Unbounded_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_300Light,
    Inter_500Medium,
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_300Light,
    Raleway_500Medium,
  })

  if (!fontsLoaded) {
    return null
  }

  return (
    <Provider>
      <NativeNavigation />
    </Provider>
  )
}
