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
  ENABLED: process.env.NEXT_PUBLIC_DISABLE_GA !== 'true',
  
  // Debug mode for development
  DEBUG: process.env.NEXT_PUBLIC_GA_DEBUG === 'true',
}
