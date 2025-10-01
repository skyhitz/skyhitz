/**
 * Google Analytics Configuration
 * Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 measurement ID
 */

export const GA_CONFIG = {
  // Replace with your actual Google Analytics 4 measurement ID
  // Format: G-XXXXXXXXXX
  MEASUREMENT_ID: 'G-SN8H79EHDJ',
  
  // Enable/disable analytics tracking
  ENABLED: process.env.NEXT_PUBLIC_DISABLE_GA !== 'true',
  
  // Debug mode for development
  DEBUG: process.env.NEXT_PUBLIC_GA_DEBUG === 'true',
}
