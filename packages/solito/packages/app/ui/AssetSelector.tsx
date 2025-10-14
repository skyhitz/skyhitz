'use client'
import { View, Pressable } from 'react-native'
import { P } from 'app/design/typography'
import { AssetType, ASSET_INFO } from 'app/types/asset'
import { useAssetStore } from 'app/state/asset'
import Stellar from 'app/ui/icons/stellar'
import Hitz from 'app/ui/icons/hitz'
import { ChevronDown } from 'app/ui/icons/chevron-down'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { USER_HITZ_BALANCE, USER_CREDITS } from 'app/api/graphql/operations'

/**
 * Asset Selector Component
 * 
 * Dropdown to switch between XLM and HITZ tokens
 * Shows current asset with icon and ticker
 */
export function AssetSelector() {
  const { selectedAsset, setSelectedAsset } = useAssetStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<View>(null)

  // Fetch balances to decide which assets to show
  const { data: hitzData } = useQuery(USER_HITZ_BALANCE)
  const { data: xlmData } = useQuery(USER_CREDITS)

  const hitzBalance = (hitzData?.userHitzBalance ?? 0) as number
  const xlmBalance = (xlmData?.userCredits ?? 0) as number

  // Only show HITZ if user has a positive balance
  const assets = [AssetType.XLM].concat(hitzBalance > 0 ? [AssetType.HITZ] as const : [])
  const currentAssetInfo = ASSET_INFO[selectedAsset]

  const handleSelect = (asset: AssetType) => {
    setSelectedAsset(asset)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside (web only)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (containerRef.current && !target.closest('[data-asset-selector]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getAssetIcon = (assetType: AssetType) => {
    if (assetType === AssetType.XLM) {
      return <Stellar size={18} />
    }
    return <Hitz size={18} className="text-[--text-color]" />
  }

  return (
    <View 
      ref={containerRef} 
      className="relative" 
      data-asset-selector="true"
    >
      {/* Selected Asset Button */}
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center gap-2 rounded-lg bg-[--bg-secondary-color] px-3 py-2 border border-[--border-color]"
      >
        {getAssetIcon(selectedAsset)}
        <P className="font-unbounded text-sm text-[--text-color]">
          {currentAssetInfo.ticker}
        </P>
        <ChevronDown 
          size={16} 
          className={`text-[--text-secondary-color] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Pressable>

      {/* Dropdown Menu */}
      {isOpen && (
        <View className="absolute top-full mt-1 w-full rounded-lg border border-[--border-color] bg-[--bg-color] shadow-lg z-50">
          {assets.map((asset) => {
            const info = ASSET_INFO[asset]
            const isSelected = asset === selectedAsset

            return (
              <Pressable
                key={asset}
                onPress={() => handleSelect(asset)}
                className={`flex-row items-center gap-3 px-3 py-3 border-b border-[--border-color] last:border-b-0 ${
                  isSelected ? 'bg-[--bg-secondary-color]' : ''
                }`}
              >
                {getAssetIcon(asset)}
                <View className="flex-1">
                  <P className="font-unbounded text-sm text-[--text-color] font-medium">
                    {info.ticker}
                  </P>
                  <P className="text-xs text-[--text-secondary-color] mt-0.5">
                    {info.name}
                  </P>
                </View>
                {isSelected && (
                  <View className="h-2 w-2 rounded-full bg-[--primary-color]" />
                )}
              </Pressable>
            )
          })}
        </View>
      )}
    </View>
  )
}

