import 'app/design/global.css'
import { inter, raleway, unbounded } from './fonts'
import { Provider } from 'app/provider/index'
import { ThemeProvider } from 'app/provider/theme'
import { MainLayout } from 'app/ui/shared-layouts/MainLayout'
import type { Metadata } from 'next'
import { Config } from 'app/config'
import { siteTitle, socialDesc, keywords, orgName } from 'app/constants/content'
import { GA_CONFIG } from 'app/config/analytics'

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
  openGraph: {
    type: 'website',
    url: Config.APP_URL,
    siteName: 'Skyhitz',
    title: siteTitle,
    description: socialDesc,
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
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
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
        {/* Google Analytics */}
        {GA_CONFIG.ENABLED && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_CONFIG.MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_CONFIG.MEASUREMENT_ID}', {
                    page_title: document.title,
                    page_location: window.location.href
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <ThemeProvider>
        <Provider>
          <MainLayout>{children}</MainLayout>
        </Provider>
      </ThemeProvider>
    </html>
  )
}
