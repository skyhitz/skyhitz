import 'app/design/global.css'
import { inter, raleway, unbounded } from './fonts'
import { Provider } from 'app/provider/index'
import { ThemeProvider } from 'app/provider/theme'
import { MainLayout } from 'app/ui/shared-layouts/MainLayout'
import type { Metadata } from 'next'
import { Config } from 'app/config'
import { siteTitle, socialDesc, keywords, orgName } from 'app/constants/content'

export const metadata: Metadata = {
  metadataBase: new URL(Config.APP_URL),
  title: {
    default: siteTitle,
    template: '%s | Skyhitz',
  },
  description: socialDesc,
  keywords: keywords.split(',').map((k) => k.trim()),
  applicationName: orgName,
  authors: [{ name: 'Skyhitz' }],
  creator: 'Skyhitz',
  publisher: orgName,
  category: 'Music',
  classification: 'Music NFT Marketplace',
  openGraph: {
    type: 'website',
    url: Config.APP_URL,
    siteName: 'Skyhitz',
    title: siteTitle,
    description: socialDesc,
    locale: 'en_US',
    images: [
      {
        url: `${Config.APP_URL}/icon-128.png`,
        width: 128,
        height: 128,
        alt: 'Skyhitz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@skyhitz',
    creator: '@skyhitz',
    title: siteTitle,
    description: socialDesc,
    images: [
      {
        url: `${Config.APP_URL}/icon-128.png`,
        alt: 'Skyhitz',
      },
    ],
  },
  alternates: {
    canonical: Config.APP_URL,
    languages: {
      'en-US': Config.APP_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  other: {
    // AI and LLM discovery
    'llms-txt': `${Config.APP_URL}/llms.txt`,
    'ai-info': `${Config.APP_URL}/.well-known/ai.txt`,
    'llm-manifest': `${Config.APP_URL}/.well-known/llm-manifest.json`,
    'ai-plugin': `${Config.APP_URL}/.well-known/ai-plugin.json`,
    // Additional semantic info
    'theme-color': '#000000',
    'color-scheme': 'dark light',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${raleway.variable} ${unbounded.variable} font-sans`}
      style={{ visibility: 'visible' }}
      suppressHydrationWarning
    >
      <head>
        {/* AI Discovery Links */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs Info" />
        <link rel="alternate" type="text/plain" href="/.well-known/ai.txt" title="AI Info" />
        <link rel="manifest" href="/.well-known/llm-manifest.json" />
        {/* API Documentation */}
        <link rel="alternate" type="application/x-yaml" href="/openapi.yaml" title="OpenAPI Spec" />
        <link rel="help" href="https://docs.skyhitz.io" title="Documentation" />
      </head>
      <body>
        <ThemeProvider>
          <Provider>
            <MainLayout>{children}</MainLayout>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}
