/**
 * Persistent Player Components
 * 
 * This module provides a persistent audio/video player that stays mounted
 * across navigation, similar to Spotify or YouTube Music.
 * 
 * Architecture:
 * - PersistentPlayer: The actual ReactPlayer/media element, always mounted at Provider level
 * - FloatingMiniPlayer: Shows player controls on pages without the main navigation UI
 * - Portal targets: Used by PersistentPlayer to render video in the appropriate location
 */

export { PersistentPlayer, PLAYER_PORTAL_TARGETS } from './PersistentPlayer'
export { FloatingMiniPlayer } from './FloatingMiniPlayer'

