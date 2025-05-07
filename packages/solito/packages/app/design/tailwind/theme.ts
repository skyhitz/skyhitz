const { platformSelect } = require('nativewind/theme')

/** @type {import('tailwindcss').Config['theme']} */
export const theme = {
  // edit your tailwind theme here!
  // https://tailwindcss.com/docs/adding-custom-styles
  extend: {
    fontFamily: {
      inter: platformSelect({
        ios: 'Inter-Regular',
        android: 'Inter_400Regular',
        default: 'var(--font-inter)',
      }),
      'inter-semibold': platformSelect({
        ios: 'Inter-SemiBold',
        android: 'Inter_600SemiBold',
        default: 'var(--font-inter)',
      }),
      'inter-bold': platformSelect({
        ios: 'Inter-Bold',
        android: 'Inter_700Bold',
        default: 'var(--font-inter)',
      }),
      raleway: platformSelect({
        ios: 'Raleway-Regular',
        android: 'Raleway_400Regular',
        default: 'var(--font-raleway)',
      }),
      'raleway-light': platformSelect({
        ios: 'Raleway-Light',
        android: 'Raleway_300Light',
        default: 'var(--font-raleway)',
      }),
      'raleway-medium': platformSelect({
        ios: 'Raleway-Medium',
        android: 'Raleway_500Medium',
        default: 'var(--font-raleway)',
      }),
      'raleway-semibold': platformSelect({
        ios: 'Raleway-SemiBold',
        android: 'Raleway_600SemiBold',
        default: 'var(--font-raleway)',
      }),
      'raleway-bold': platformSelect({
        ios: 'Raleway-Bold',
        android: 'Raleway_700Bold',
        default: 'var(--font-raleway)',
      }),
      unbounded: platformSelect({
        ios: 'Unbounded-SemiBold',
        android: 'Unbounded_600SemiBold',
        default: 'var(--font-unbounded)',
      }),
    },
    colors: {
      // Primary colors - referencing our CSS variables whenever possible
      blue: {
        DEFAULT: 'var(--primary-color)',  // Default blue references primary CSS variable
        brand: '#1dadff',                  // Keep for the logo gradient
        start: '#63AADF',                  // Keep for gradients
        middle: '#21ACFE',                 // Keep for gradients
        end: '#D4EFFF',                    // Keep for gradients
      },
      
      // Basic colors that might still be needed in some components
      white: '#ffffff',
      black: '#000000',
      grey: {
        DEFAULT: 'rgb(75 85 99)',  // Matches our --text-color in light mode
        light: '#dbdbdb',
      },
      
      // Utility colors for specific states
      transparent: 'rgba(0,0,0,0)',
      red: '#ff444a',               // For errors
      green: '#5ce67e',             // For success
      
      // Form validation
      valid: 'rgba(15,172,141,.8)',
      
      // Keep only essential UI elements that might not be converted yet
      profileOverlayBackground: 'rgba(0,0,0,0.3)',
    },
  },
}
