import { useCallback } from 'react'
import { useRouter, usePathname } from 'solito/navigation'

type Result = {
  onAuthRedirect: (auth: boolean) => void
}

export function useOnAuthRedirect(): Result {
  const { push } = useRouter()
  const path = usePathname()
  const defaultPath = '/dashboard/search'

  const onAuthRedirect = useCallback(
    (auth: boolean) => {
      if (auth) {
        if (path === '/') {
          push(defaultPath)
        } else {
          push(path ? path : defaultPath)
        }
      }
    },
    [push, path],
  )

  return { onAuthRedirect }
}
