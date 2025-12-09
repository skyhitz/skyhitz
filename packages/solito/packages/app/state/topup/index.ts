'use client'
import { create } from 'zustand'

type TopUpAction = 'mine' | 'download' | 'like' | 'playback'

type TopUpContext = {
  action: TopUpAction
  requiredHITZ: number
  availableHITZ: number
  message?: string
}

type TopUpModalState = {
  visible: boolean
  context: TopUpContext | null
  openTopUpModal: (ctx: TopUpContext) => void
  closeTopUpModal: () => void
}

export const useTopUpModalStore = create<TopUpModalState>((set) => ({
  visible: false,
  context: null,
  openTopUpModal: (context) => set({ visible: true, context }),
  closeTopUpModal: () => set({ visible: false, context: null }),
}))
