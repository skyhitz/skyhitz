import { View } from 'react-native'
import { openEmail } from 'app/utils/email'
import { P } from 'app/design/typography'
import { Button } from 'app/design/button'

export function OpenEmailView() {
  return (
    <View className="flex items-center">
      <P className="flex h-12 w-full flex-row items-center rounded-lg bg-gray-700/20 p-2 text-sm text-white">
        We send you an email to access your account!
      </P>
      <Button
        text="Open Email"
        onPress={() => openEmail()}
        className="btn mt-4"
      />
    </View>
  )
}
