/**
 * Asset Types for Skyhitz Platform
 * 
 * Users can hold and transact in two assets:
 * - XLM: Stellar's native cryptocurrency
 * - HITZ: Skyhitz's platform token (OpenZeppelin SEP-41 compatible)
 */

export enum AssetType {
  XLM = 'XLM',
  HITZ = 'HITZ',
}

export interface AssetInfo {
  type: AssetType
  name: string
  ticker: string
  decimals: number
  description: string
}

export const ASSET_INFO: Record<AssetType, AssetInfo> = {
  [AssetType.XLM]: {
    type: AssetType.XLM,
    name: 'Stellar Lumens',
    ticker: 'XLM',
    decimals: 7,
    description: 'Stellar native cryptocurrency for fees and payments',
  },
  [AssetType.HITZ]: {
    type: AssetType.HITZ,
    name: 'Skyhitz Token',
    ticker: 'HITZ',
    decimals: 7,
    description: 'Platform token for staking and rewards',
  },
}

/**
 * Convert stroops to display value
 * Both XLM and HITZ use 7 decimals (10^7 stroops = 1 token)
 */
export function stroopsToToken(stroops: number, assetType: AssetType): number {
  return stroops / 10_000_000
}

/**
 * Convert display value to stroops
 * Both XLM and HITZ use 7 decimals
 */
export function tokenToStroops(amount: number, assetType: AssetType): number {
  return Math.floor(amount * 10_000_000)
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number, assetType: AssetType): string {
  const info = ASSET_INFO[assetType]
  return `${amount.toFixed(2)} ${info.ticker}`
}

