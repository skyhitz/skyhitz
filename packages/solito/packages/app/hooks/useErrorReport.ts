/**
 * Error reporting hook
 * Used to report errors throughout the application
 */
import { useCallback } from 'react'

export function useErrorReport() {
  /**
   * Reports an error to the console or to any error tracking service
   * @param error The error to report
   */
  const reportError = useCallback((error: Error | string) => {
    // For now, we just log to console
    // In a production environment, this would send errors to a tracking service
    // like Sentry, LogRocket, etc.
    const errorMessage = typeof error === 'string' ? error : error.message
    console.error('[Error]', errorMessage)
    
    // Here you could add integration with error tracking services
    // if (process.env.NODE_ENV === 'production') {
    //   // Send to error tracking service
    // }
  }, [])

  return reportError
}
