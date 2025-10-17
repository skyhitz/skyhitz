/**
 * Utilities for identifying and handling external preview entries
 * 
 * External entries are tracks from Audius or Sound.xyz that are being previewed
 * before they are "mined" into the platform. These entries should have limited
 * functionality - only the mine action should be enabled.
 */

/**
 * Check if an entry is an external preview (from Audius or Sound.xyz)
 * External entries have IDs that start with "audius:" or "soundxyz:"
 */
export function isExternalPreview(entryId?: string): boolean {
  if (!entryId) return false
  return entryId.startsWith('audius:') || entryId.startsWith('soundxyz:')
}

/**
 * Check if an entry URL is an external URL (not IPFS-based)
 */
export function isExternalUrl(url?: string): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

