import { useSearchParams } from 'solito/navigation'
import { useMemo } from 'react'

export type SignInParam = {
  token: string
  uid: string
  redirect?: string // Optional redirect URL after sign-in
}

export const useSignInParam = (): SignInParam | undefined => {
  const searchParams = useSearchParams()

  const token = searchParams ? searchParams.get('token') : null
  const uid = searchParams ? searchParams.get('uid') : null
  const redirect = searchParams ? searchParams.get('redirect') : null

  return useMemo(() => {
    if (token && uid) return { token, uid, redirect: redirect || undefined }
    return undefined
  }, [token, uid, redirect])
}
