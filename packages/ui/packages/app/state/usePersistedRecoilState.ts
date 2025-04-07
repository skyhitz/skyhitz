import { useEffect, useState } from 'react'
import { RecoilState, useRecoilState, useResetRecoilState } from 'recoil'

type SetState<T> = (oldState: T) => T

export interface PersistedAtomState<T> {
  state: T | null
  setState?: (newState: T | SetState<T>) => void
  resetState?: () => void
  loadingLocalStorage: boolean
}

// Hook created just to make sure that recoil-persist pulls values from localstorage after client side hydration
// https://github.com/vercel/next.js/discussions/18271
// https://stackoverflow.com/questions/75633186/is-there-any-trick-to-make-the-code-only-run-when-hydrating-html
export const usePersistedRecoilState = <T>(
  atom: RecoilState<T>,
): PersistedAtomState<T> => {
  const [state, setState] = useRecoilState(atom)
  const clearState = useResetRecoilState(atom)
  const [returnValue, setReturnValue] = useState<PersistedAtomState<T>>({
    loadingLocalStorage: true,
    state: null,
  })

  /*
   * This useEffect will be run right after the client side hydration,
   * which will let next.js compare client and server versions of html with no problems.
   */
  useEffect(() => {
    setReturnValue({
      state,
      setState,
      resetState: clearState,
      loadingLocalStorage: false,
    })
  }, [state, setState, clearState])

  return returnValue
}
