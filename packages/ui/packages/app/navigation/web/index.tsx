'use client'
import { View } from 'react-native'
import React from 'react'
import { DashboardNavigation } from 'app/ui/navigation/dashboardNavigation'
import { usePathname } from 'solito/navigation'

export function WebNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname && pathname.includes('dashboard')) {
    return <DashboardNavigation>{children}</DashboardNavigation>
  }
  return <View className="flex flex-1">{children}</View>
}
