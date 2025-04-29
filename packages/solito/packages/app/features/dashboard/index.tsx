'use client'

import { withAuth } from 'app/provider/auth'
import { View } from 'react-native'
import { H1, H2, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useLogOut } from 'app/hooks/useLogIn'
import { useUserAtomState } from 'app/state/user/hooks'

function DashboardScreen() {
  const logOut = useLogOut()
  const { user } = useUserAtomState()

  return (
    <View className="flex-1 items-center justify-center bg-black p-6">
      <View className="w-full max-w-md rounded-lg bg-gray-900 p-6">
        <H1 className="text-center text-white">Dashboard</H1>
        
        <View className="my-6 rounded-lg bg-gray-800 p-4">
          <H2 className="mb-2 text-lg text-white">Account Info</H2>
          <P className="text-gray-300">
            Username: <P className="font-bold text-white">{user?.username || 'Not available'}</P>
          </P>
          <P className="mt-1 text-gray-300">
            Email: <P className="font-bold text-white">{user?.email || 'Not available'}</P>
          </P>
          {user?.publicKey && (
            <P className="mt-1 text-gray-300">
              Wallet: <P className="font-bold text-white truncate">{user.publicKey}</P>
            </P>
          )}
        </View>
        
        <View className="mt-2 flex flex-row justify-around">
          <Button
            text="Search"
            onPress={() => {}}
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
