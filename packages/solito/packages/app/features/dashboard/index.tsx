'use client'

import { withAuth } from 'app/provider/auth'
import { View } from 'react-native'
import { H1, H2, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useLogOut } from 'app/hooks/useLogIn'
import { useUserState } from 'app/state/user/hooks'
import { useRouter } from 'solito/navigation'

function DashboardScreen() {
  const logOut = useLogOut()
  const { user } = useUserState()
  const { push } = useRouter()
  
  console.log('Dashboard user state:', user)

  return (
    <View className="flex-1 items-center justify-center bg-black p-6">
      <View className="w-full max-w-md rounded-lg bg-gray-900 p-6">
        <H1 className="text-center text-white">Dashboard</H1>
        
        <View className="my-6 rounded-lg bg-gray-800 p-4">
          <H2 className="mb-2 text-lg text-white">Account Info</H2>
          <View className="flex-row items-center">
            <P className="text-gray-300">Username: </P>
            <P className="font-bold text-white ml-1">{user?.username || 'Not available'}</P>
          </View>
          
          <View className="flex-row items-center mt-1">
            <P className="text-gray-300">Email: </P>
            <P className="font-bold text-white ml-1">{user?.email || 'Not available'}</P>
          </View>
          
          {user?.publicKey && (
            <View className="flex-row items-center mt-1">
              <P className="text-gray-300">Wallet: </P>
              <P className="font-bold text-white ml-1 truncate">{user.publicKey}</P>
            </View>
          )}
        </View>
        
        <View className="mt-2 flex flex-row justify-around">
          <Button
            text="Search"
            onPress={() => push('/dashboard/search')}
            variant="primary"
            className="flex-1 mx-1"
          />
          <Button
            text="Chart"
            onPress={() => {}}
            variant="secondary"
            className="flex-1 mx-1"
          />
        </View>
        
        <Button
          text="Log Out"
          onPress={logOut}
          variant="secondary"
          className="mt-6"
        />
      </View>
    </View>
  )
}

// Wrap with auth protection
export default withAuth(DashboardScreen)
