/**
 * Core navigation hook that provides type-safe navigation capabilities
 * across both web and mobile platforms using Solito
 */
import { useRouter, usePathname } from 'solito/navigation'
import { ROUTES } from 'app/constants/routes'

export type RouteParams = {
  [key: string]: string | number
}

export function useAppNavigation() {
  const { push, replace, back } = useRouter()
  // Ensure pathname is always a string
  const pathnameOrUndefined = usePathname()
  const pathname: string = pathnameOrUndefined || ''

  /**
   * Builds a path with parameters
   */
  const buildPath = (route: string, params?: RouteParams): string => {
    if (!params) return route
    
    let path = route
    Object.entries(params).forEach(([key, value]) => {
      // Replace dynamic segments like [id] with the actual value
      path = path.replace(`[${key}]`, String(value))
    })
    
    return path
  }

  /**
   * Navigate to a new route, replacing all parameters in dynamic route segments
   */
  const navigateTo = (route: string, params?: RouteParams) => {
    const path = buildPath(route, params)
    push(path)
  }

  /**
   * Replace the current route, preserving history stack position
   */
  const replaceTo = (route: string, params?: RouteParams) => {
    const path = buildPath(route, params)
    replace(path)
  }

  /**
   * Get the current route segment (last part of the path)
   */
  const getCurrentSegment = (): string => {
    if (!pathname) return ''
    const segments = pathname.split('/').filter(Boolean)
    return segments.length > 0 ? segments[segments.length - 1] : ''
  }

  /**
   * Check if the current route matches a specific path
   */
  const isCurrentRoute = (route: string): boolean => {
    if (!pathname) return false
    return pathname === route
  }

  /**
   * Check if the current route starts with a specific path
   */
  const isRouteActive = (route: string): boolean => {
    if (!pathname) return false
    return pathname === route || pathname.startsWith(`${route}/`)
  }

  return {
    push,
    replace,
    back,
    pathname,
    navigateTo,
    replaceTo,
    buildPath,
    getCurrentSegment,
    isCurrentRoute,
    isRouteActive,
  }
}
