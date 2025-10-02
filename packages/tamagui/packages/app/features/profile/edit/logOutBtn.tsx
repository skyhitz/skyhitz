'use client'
import { useLogOut } from 'app/hooks/useLogIn'
import { Button } from 'app/design/button'
import { YStack } from 'tamagui'

export function LogOutBtn() {
  const logOut = useLogOut()

  return (
    <YStack marginVertical="$4" width="100%">
      <Button
        onPress={logOut}
        text="Log Out"
        variant="danger"
        size="medium"
        width="100%"
      />
    </YStack>
  )
}
