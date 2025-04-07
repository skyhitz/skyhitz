import { Entry } from 'app/api/graphql'
import { useEffect } from 'react'
import { getEntry } from './getEntry'
import { useRecoilState, useResetRecoilState } from 'recoil'
import { entryDetailAtom } from 'app/state/entry'

type Props = {
  id: string
  serverEntry?: Entry
}

type Result = {
  entry?: Entry
  getEntry: (id: string) => Promise<Entry | null>
  refetch: () => Promise<void>
}

export function useGetEntry({ id, serverEntry }: Props): Result {
  const [entry, setEntry] = useRecoilState(entryDetailAtom)
  const resetAtom = useResetRecoilState(entryDetailAtom)
  const skip = serverEntry !== undefined

  const fetchAndSet = async (id: string) => {
    const entry = await getEntry(id)
    entry ? setEntry(entry) : null
  }

  const refetch = async () => {
    console.log('refetch')
    entry ? fetchAndSet(id) : null
  }

  useEffect(() => {
    if (!skip) {
      fetchAndSet(id)
    }
    return () => {
      console.log('resetting entry')
      resetAtom()
    }
  }, [skip])

  return { entry: entry ?? serverEntry, getEntry, refetch }
}
