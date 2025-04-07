import { Inter, Raleway, Unbounded } from 'next/font/google'

export const inter = Inter({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const raleway = Raleway({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

export const unbounded = Unbounded({
  weight: ['600'],
  subsets: ['latin'],
  variable: '--font-unbounded',
  display: 'swap',
})
