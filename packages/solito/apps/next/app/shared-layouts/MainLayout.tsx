'use client'
import { usePathname } from 'next/navigation'
import { MainNavigation } from 'app/ui/navigation/MainNavigation'
import { shouldUseNavigationUI } from 'app/constants/routes'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if the current path should use the main navigation
  const shouldShowNavigation = shouldUseNavigationUI(pathname)

  // If the path should use navigation, wrap the children with it
  if (shouldShowNavigation) {
    return <MainNavigation>{children}</MainNavigation>
  }

  // Otherwise, just render the children without the navigation wrapper
  return <>{children}</>
}
