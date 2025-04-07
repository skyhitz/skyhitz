import { atom } from 'recoil'
import { Entry } from 'app/api/graphql'

export const entryDetailAtom = atom<Entry | undefined>({
  key: 'entryDetailAtom',
  default: undefined,
})
