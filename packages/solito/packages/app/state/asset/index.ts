import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AssetType } from 'app/types/asset'

interface AssetState {
  selectedAsset: AssetType
  setSelectedAsset: (asset: AssetType) => void
}

/**
 * Asset Selection Store
 * 
 * Manages which asset the user currently has selected.
 * In the HITZ-only economy, this defaults to HITZ.
 * Persisted to localStorage/AsyncStorage so selection survives app restart.
 */
export const useAssetStore = create<AssetState>()(
  persist(
    (set) => ({
      selectedAsset: AssetType.HITZ, // Default to HITZ
      setSelectedAsset: (asset: AssetType) => set({ selectedAsset: asset }),
    }),
    {
      name: 'skyhitz-asset-selection', // Storage key
      storage: createJSONStorage(() => {
        // Use localStorage on web, AsyncStorage on native
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Fallback for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    }
  )
)
