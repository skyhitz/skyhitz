'use client'
import { useSignOut } from 'app/hooks/useSignIn'
import { Button } from 'app/design/button'
import { View } from 'react-native'

export function LogOutBtn() {
  const signOut = useSignOut()

  return (
    <View className="my-4 w-full">
      <Button
        onPress={signOut}
        text="Log Out"
        variant="primary"
        size="default"
        className="w-full bg-red"
      />
    </View>
  )
}
