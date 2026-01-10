import 'app/design/global.css'
import { inter, raleway, unbounded } from './fonts'
import type { Metadata } from 'next'
import { Config } from 'app/config'

export const metadata: Metadata = {
  metadataBase: new URL(Config.APP_URL),
  title: 'Skyhitz - Archived',
  description: 'Skyhitz has been archived due to a security vulnerability.',
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

// Hardcoded dark theme CSS variables for static rendering
const darkThemeStyles = {
  '--bg-color': '#161616',
  '--surface-color': '#000000',
  '--text-color': 'rgb(179, 186, 197)',
  '--text-secondary-color': 'rgb(217, 220, 226)',
  '--primary-color': '#19aafe',
  '--secondary-color': '#6B7280',
  '--accent-color': '#19aafe',
  '--border-color': '#1A1A1A',
  '--card-bg-color': '#000000',
  '--button-bg-color': '#19aafe',
  '--button-text-color': '#FFFFFF',
  '--invest-button-bg-color': '#19aafe',
  '--invest-button-text-color': '#FFFFFF',
  '--description-bg-color': '#000000',
  '--bg-secondary-color': '#1A1A1A',
  '--success-bg-color': '#5ce67e',
  '--error-bg-color': '#ff444a',
  '--logo-color': '#e5e7eb',
} as React.CSSProperties

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${raleway.variable} ${unbounded.variable} font-sans`}
      data-theme="dark"
    >
      <body style={darkThemeStyles}>
        {children}
      </body>
    </html>
  )
}
