import { useSearchParams } from 'solito/navigation'
import { useMemo } from 'react'

export type SignInParam = {
  token: string
  uid: string
}

export const useSignInParam = (): SignInParam | undefined => {
  const searchParams = useSearchParams()

  const token = searchParams ? searchParams.get('token') : null
  const uid = searchParams ? searchParams.get('uid') : null

  return useMemo(() => {
    if (token && uid) return { token, uid }
    return undefined
  }, [token, uid])
}
