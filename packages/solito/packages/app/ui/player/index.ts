/**
 * Persistent Player Components
 * 
 * This module provides a persistent audio/video player that stays mounted
 * across navigation, similar to Spotify or YouTube Music.
 * 
 * Architecture:
 * - PersistentPlayer: The actual ReactPlayer/media element, always mounted at Provider level
 * - FloatingMiniPlayer: Shows player controls on pages without the main navigation UI
 * - Video only shows on entry page when viewing the currently playing track
 */

export { PersistentPlayer } from './PersistentPlayer'
export { FloatingMiniPlayer } from './FloatingMiniPlayer'

