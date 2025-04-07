import { atom } from 'recoil'
import { Entry } from 'app/api/graphql'
import { AVPlaybackStatus } from 'expo-av'

import { PlaybackState } from 'app/types'

export const playbackUriAtom = atom<string>({
  key: 'playbackUriAtom',
  default: '',
})

export const entryAtom = atom<Entry | null>({
  key: 'entryAtom',
  default: null,
})

export const playbackStateAtom = atom<PlaybackState>({
  key: 'playbackStateAtom',
  default: 'IDLE',
})

export const playingHistoryAtom = atom<Entry[]>({
  key: 'playingHistoryAtom',
  default: [],
})

export const durationAtom = atom<number>({
  key: 'durationAtom',
  default: 0,
})

export const positionAtom = atom<number>({
  key: 'positionAtom',
  default: 0,
})

export const loopingAtom = atom<boolean>({
  key: 'loopingAtom',
  default: false,
})

export const playlistAtom = atom<Entry[]>({
  key: 'playlistAtom',
  default: [],
})

export const shuffleAtom = atom<boolean>({
  key: 'shuffleAtom',
  default: false,
})

export const playbackStatusAtom = atom<AVPlaybackStatus | null>({
  key: 'playbackStatusAtom',
  default: null,
})
