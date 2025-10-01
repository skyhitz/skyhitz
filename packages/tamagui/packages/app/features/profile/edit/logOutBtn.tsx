'use client'
import { useLogOut } from 'app/hooks/useLogIn'
import { Button } from 'app/design/button'
import { View } from 'react-native'

export function LogOutBtn() {
  const logOut = useLogOut()

  return (
    <View className="my-4 w-full">
      <Button
        onPress={logOut}
        text="Log Out"
        variant="primary"
        size="default"
        className="w-full bg-red"
      />
    </View>
  )
}
