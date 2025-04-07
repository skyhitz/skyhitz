import useLogOut from 'app/hooks/useLogOut'
import { Pressable, Text } from 'react-native'
import Logout from 'app/ui/icons/logout'

export function LogOutBtn() {
  const logOut = useLogOut()

  return (
    <Pressable
      className="flex flex-row items-center px-4 py-3"
      onPress={logOut}
    >
      <Logout className="text-gray-600" size={22} />
      <Text className="ml-4 text-sm">Log Out</Text>
    </Pressable>
  )
}
