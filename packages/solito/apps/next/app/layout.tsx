import { StylesProvider } from './styles-provider'
import 'app/design/global.css'
import { inter, raleway, unbounded } from './fonts'
import { Provider } from 'app/provider/index'

export const metadata = {
  title: 'Skyhitz',
  description: 'Web3 Music Platform',
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
    >
      <body>
        <StylesProvider>
          <Provider>{children}</Provider>
        </StylesProvider>
      </body>
    </html>
  )
}
