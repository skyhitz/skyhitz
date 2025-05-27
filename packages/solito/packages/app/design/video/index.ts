/**
 * Platform-specific video component
 * This barrel file re-exports from the appropriate platform implementation
 */

// For web, we need to export from the web implementation
// React Native will automatically use index.native.tsx for native platforms
export * from './index.web'

// Define our own ResizeMode for consistent API between platforms
export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch'
}
