/**
 * Google Analytics Configuration
 * 
 * Note: Google Analytics is managed by Cloudflare Zaraz
 * The measurement ID and script loading are handled automatically
 * by Cloudflare's dashboard configuration.
 */

export const GA_CONFIG = {
  // Measurement ID is configured in Cloudflare Zaraz dashboard
  // This is kept for reference and potential future use
  MEASUREMENT_ID: 'G-SN8H79EHDJ',
  
  // Enable/disable analytics tracking
  // Zaraz handles script loading, this controls our event tracking
  get ENABLED() {
    if (typeof window !== 'undefined') {
      // Browser environment - check if disabled via localStorage or URL params
      const urlParams = new URLSearchParams(window.location.search)
      const disableGA = urlParams.get('disable_ga') === 'true' || 
                      localStorage.getItem('disable_ga') === 'true'
      return !disableGA
    }
    // Server-side: assume enabled unless explicitly disabled
    return process.env.NEXT_PUBLIC_DISABLE_GA !== 'true'
  },
  
  // Debug mode for development
  get DEBUG() {
    if (typeof window !== 'undefined') {
      // Browser environment - check localStorage or URL params
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('debug_ga') === 'true' || 
             localStorage.getItem('debug_ga') === 'true'
    }
    // Server-side: check environment variable
    return process.env.NEXT_PUBLIC_GA_DEBUG === 'true'
  },
}
