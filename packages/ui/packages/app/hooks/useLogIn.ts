import { useSetRecoilState } from 'recoil'
import { useUserAtomState } from 'app/state/user'
import { SecureStorage } from 'app/utils/secure-storage'
import { useRouter } from 'solito/navigation'
import { User } from 'app/api/graphql'
import { useCallback } from 'react'

export function useLogIn(): (user: User) => void {
  const { setUser } = useUserAtomState()
  const { push } = useRouter()

  const logIn = useCallback(
    async (user: User) => {
      if (setUser) setUser(user)
      if (user.jwt) {
        await SecureStorage.save('token', user.jwt!)
        await SecureStorage.save('user_id', user.id)
      }
      push('/dashboard/search')
    },
    [setUser, push],
  )

  return logIn
}
