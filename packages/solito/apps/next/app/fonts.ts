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

// Export font variables for use in tailwind theme
export const fontVariables = {
  inter: inter.variable,
  raleway: raleway.variable,
  unbounded: unbounded.variable,
}

// For React Native, we'll use these font family names
export const fontFamilies = {
  inter: 'Inter',
  raleway: 'Raleway',
  unbounded: 'Unbounded',
}
