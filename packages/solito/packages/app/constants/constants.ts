/**
 * Application constants
 */

// IPFS related constants
export const ipfsProtocol = 'ipfs://'
export const pinataGateway = 'https://ipfs.io/ipfs'
export const fallbackGateway = 'https://ipfs.io/ipfs'
export const r2Gateway = 'https://r2.skyhitz.io'

// Storage keys
export const userDataKey = 'sk:user'

// API URLs
export const nftStorageApi = 'https://api.nft.storage'
export const pinataApi = 'https://api.pinata.cloud/pinning'

// Media constants
export const preBase64String = 'data:image/jpeg;base64,'
export const preBase64StringVideo = 'data:video/mp4;base64,'
export const cloudinaryPreset = 'ed0xgbq5'

// Investment and spend thresholds (in XLM)
// Shares are only granted when amounts invested via the contract are >= 0.3 XLM.
// Below that we treat them as micro-spends that do not yield shares.
// Keep these values centralized to avoid drift across components.
export const INVEST_MIN_XLM = 0.35 // Minimum amount to be considered an investment (shares eligible)
export const MICRO_SPEND_DOWNLOAD_XLM = 0.3 // Spend before download (no shares)
export const MICRO_SPEND_LIKE_XLM = 0.2 // Spend on like (no shares)
export const MICRO_SPEND_PLAYBACK_COMPLETE_XLM = 0.1 // Spend on track completion (no shares)
export const ADMIN_ID = '-NpzLBvz8ypxJwnK3JVL'
