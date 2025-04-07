import { useUserAtomState } from 'app/state/user'
import { SecureStorage } from 'app/utils/secure-storage'
import { useRouter } from 'solito/navigation'
import { useApolloClient } from '@apollo/client'
// import { useWalletConnectClient } from "app/provider/WalletConnect";

export default function useLogOut(): () => void {
  const { clearUser } = useUserAtomState()
  const { push } = useRouter()
  const { resetStore } = useApolloClient()
  // const { disconnect } = useWalletConnectClient();

  const logOut = async () => {
    if (clearUser) clearUser()
    push('/')
    resetStore()
    // disconnect();
    await SecureStorage.clear('token')
    await SecureStorage.clear('user_id')
  }

  return logOut
}
