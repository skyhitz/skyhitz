'use client'
import { DashboardNavigation } from 'app/ui/navigation/DashboardNavigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardNavigation>
      {children}
    </DashboardNavigation>
  )
}
