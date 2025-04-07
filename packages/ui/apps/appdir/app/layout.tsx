/** @jsxImportSource react */

import 'raf/polyfill'
import 'setimmediate'

import { StylesProvider } from './styles-provider'
import { Provider } from 'app/provider'
import { inter, raleway, unbounded } from './fonts'

import './global.css'
import { WebNavigation } from 'app/navigation/web'
import { Metadata } from 'next'
import {
  combinedTitle,
  header,
  keywords,
  orgName,
  socialDesc,
} from 'app/constants/content'
import { Config } from 'app/config'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: combinedTitle,
  description: header.desc.split('. ', 1)[0],
  applicationName: orgName,
  keywords: keywords,
  openGraph: {
    title: orgName,
    description: socialDesc,
    type: 'website',
    images: { url: `${Config.APP_URL}/skyhitz.png` },
    url: Config.APP_URL,
    siteName: orgName,
  },
  twitter: {
    site: '@skyhitz',
    creator: '@alejoskyhitz',
    description: socialDesc,
    title: combinedTitle,
    images: { url: `${Config.APP_URL}/skyhitz.png` },
    card: 'summary',
  },
  alternates: {
    canonical: Config.APP_URL,
  },
  icons: { icon: '/icon.png', apple: '/icon.png' },
  other: {
    ['fb:app_id']: '564403243666491',
    ['p:domain_verify']: '418ab0845b3db4cf3f4c9efe8ad0f80e',
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
      className={`${inter.variable} ${raleway.variable}  ${unbounded.variable} font-sans text-gray-600`}
    >
      <head>
        <link
          crossOrigin="anonymous"
          href={`https://${Config.ALGOLIA_APP_ID}-dsn.algolia.net`}
          rel="preconnect"
        />
      </head>
      <body>
        <StylesProvider>
          <Provider>
            <WebNavigation>{children}</WebNavigation>
          </Provider>
        </StylesProvider>
      </body>
    </html>
  )
}
