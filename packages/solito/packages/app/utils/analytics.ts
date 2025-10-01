/**
 * Google Analytics tracking utilities
 * Provides a unified interface for tracking events across web and mobile platforms
 */

import { Platform } from 'react-native'
import { GA_CONFIG } from 'app/config/analytics'

// Define the analytics event types
export type AnalyticsEvent = 
  | 'signed_in'
  | 'signed_out'
  | 'sign_up'
  | 'stream'
  | 'like'
  | 'download'
  | 'invest'
  | 'mine'

// Define event parameters interface
export interface AnalyticsEventParams {
  event_name: AnalyticsEvent
  entry_id?: string
  entry_title?: string
  entry_artist?: string
  amount?: number
  currency?: string
  user_id?: string
  [key: string]: any
}

/**
 * Track an analytics event
 * @param params - Event parameters including event_name and additional data
 */
export function trackEvent(params: AnalyticsEventParams): void {
  // Skip tracking if analytics is disabled
  if (!GA_CONFIG.ENABLED) {
    if (GA_CONFIG.DEBUG) {
      console.log(`[Analytics Debug] Would track ${params.event_name}:`, params)
    }
    return
  }

  try {
    if (Platform.OS === 'web') {
      // Web implementation using gtag
      if (typeof window !== 'undefined' && (window as any).gtag) {
        const { event_name, ...eventParams } = params
        
        // Map our event names to GA4 event names
        const gaEventName = mapEventName(event_name)
        
        // Send to Google Analytics
        ;(window as any).gtag('event', gaEventName, {
          ...eventParams,
          // Add custom parameters for better tracking
          custom_parameter_1: event_name,
          custom_parameter_2: params.entry_id || '',
          custom_parameter_3: params.entry_title || '',
        })
        
        if (GA_CONFIG.DEBUG) {
          console.log(`[Analytics] Tracked ${event_name}:`, eventParams)
        }
      } else {
        console.warn('[Analytics] gtag not available on web')
      }
    } else {
      // Mobile implementation - for now just log
      // In a real implementation, you would use:
      // - Firebase Analytics for React Native
      // - Or a cross-platform analytics service
      if (GA_CONFIG.DEBUG) {
        console.log(`[Analytics Mobile] Tracked ${params.event_name}:`, params)
      }
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error)
  }
}

/**
 * Map our internal event names to Google Analytics event names
 */
function mapEventName(eventName: AnalyticsEvent): string {
  const eventMap: Record<AnalyticsEvent, string> = {
    signed_in: 'signed_in',
    signed_out: 'signed_out',
    sign_up: 'sign_up',
    stream: 'stream',
    like: 'like',
    download: 'download',
    invest: 'invest',
    mine: 'mine',
  }
  
  return eventMap[eventName] || eventName
}

/**
 * Track user sign-in
 */
export function trackSignIn(userId?: string): void {
  trackEvent({
    event_name: 'signed_in',
    user_id: userId,
  })
}

/**
 * Track user sign-up
 */
export function trackSignUp(userId?: string): void {
  trackEvent({
    event_name: 'sign_up',
    user_id: userId,
  })
}

/**
 * Track user sign-out
 */
export function trackSignOut(userId?: string): void {
  trackEvent({
    event_name: 'signed_out',
    user_id: userId,
  })
}

/**
 * Track stream/playback event
 */
export function trackStream(entryId: string, entryTitle?: string, entryArtist?: string): void {
  trackEvent({
    event_name: 'stream',
    entry_id: entryId,
    entry_title: entryTitle,
    entry_artist: entryArtist,
  })
}

/**
 * Track like event
 */
export function trackLike(entryId: string, entryTitle?: string, entryArtist?: string): void {
  trackEvent({
    event_name: 'like',
    entry_id: entryId,
    entry_title: entryTitle,
    entry_artist: entryArtist,
  })
}

/**
 * Track download event
 */
export function trackDownload(entryId: string, entryTitle?: string, entryArtist?: string): void {
  trackEvent({
    event_name: 'download',
    entry_id: entryId,
    entry_title: entryTitle,
    entry_artist: entryArtist,
  })
}

/**
 * Track investment event
 */
export function trackInvest(entryId: string, amount: number, currency: string = 'XLM', entryTitle?: string, entryArtist?: string): void {
  trackEvent({
    event_name: 'invest',
    entry_id: entryId,
    entry_title: entryTitle,
    entry_artist: entryArtist,
    amount: amount,
    currency: currency,
  })
}

/**
 * Track mine event
 */
export function trackMine(entryId: string, entryTitle?: string, entryArtist?: string): void {
  trackEvent({
    event_name: 'mine',
    entry_id: entryId,
    entry_title: entryTitle,
    entry_artist: entryArtist,
  })
}
