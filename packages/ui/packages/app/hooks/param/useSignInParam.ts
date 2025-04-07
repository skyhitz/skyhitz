import { useSearchParams } from 'solito/navigation'
import { useMemo } from 'react'

export type SignInParam = {
  token: string
  uid: string
}

export const useSignInParam = (): SignInParam | undefined => {
  const searchParams = useSearchParams<SignInParam>()

  const token = searchParams?.get('token')
  const uid = searchParams?.get('uid')

  return useMemo(() => {
    if (token && uid) return { token, uid }
  }, [token, uid])
}
