'use client'
import { useLogOut } from 'app/hooks/useLogIn'
import { Button } from 'app/design/button'
import { View } from 'react-native'
import { P } from 'app/design/typography'

export function LogOutBtn() {
  const logOut = useLogOut()
  
  return (
    <View className="my-4 w-full">
      <P className="mb-2 font-medium text-gray-400">
        Click below to sign out from this device
      </P>
      <Button
        onPress={logOut}
        text="Log Out"
        variant="danger"
        size="medium"
      />
    </View>
  )
}
