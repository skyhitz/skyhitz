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
        default: 'Inter_400Regular',
      }),
      'inter-semibold': platformSelect({
        ios: 'Inter-SemiBold',
        android: 'Inter_600SemiBold',
        default: 'Inter_600SemiBold',
      }),
      'inter-bold': platformSelect({
        ios: 'Inter-Bold',
        android: 'Inter_700Bold',
        default: 'Inter_700Bold',
      }),
      raleway: platformSelect({
        ios: 'Raleway-Regular',
        android: 'Raleway_400Regular',
        default: 'Raleway_400Regular',
      }),
      'raleway-light': platformSelect({
        ios: 'Raleway-Light',
        android: 'Raleway_300Light',
        default: 'Raleway_300Light',
      }),
      'raleway-medium': platformSelect({
        ios: 'Raleway-Medium',
        android: 'Raleway_500Medium',
        default: 'Raleway_500Medium',
      }),
      'raleway-semibold': platformSelect({
        ios: 'Raleway-SemiBold',
        android: 'Raleway_600SemiBold',
        default: 'Raleway_600SemiBold',
      }),
      'raleway-bold': platformSelect({
        ios: 'Raleway-Bold',
        android: 'Raleway_700Bold',
        default: 'Raleway_700Bold',
      }),
      unbounded: platformSelect({
        ios: 'Unbounded-SemiBold',
        android: 'Unbounded_600SemiBold',
        default: 'Unbounded_600SemiBold',
      }),
    },
    colors: {
      blue: {
        DEFAULT: '#1eaeff',
        dark: '#1A1B20',
        field: '#292b33',
        transparent: '#292b33e6',
        track: '#292b33',
        light: '#00aeefe6',
        brand: '#1dadff',
        start: '#63AADF',
        middle: '#21ACFE',
        end: '#D4EFFF',
      },
      red: {
        DEFAULT: '#ff444a',
        dark: '#241e22',
      },
      white: {
        DEFAULT: '#ffffff',
      },
      grey: {
        DEFAULT: '#4b5563',
        dark: '#2B3033',
        light: '#dbdbdb',
      },
      green: {
        DEFAULT: '#5ce67e',
      },
      lightGreen: '#5ce67e',
      valid: {
        DEFAULT: 'rgba(15,172,141,.8)',
        dark: '#192225',
      },
      tab: {
        DEFAULT: 'rgba(255, 255, 255, 0.6)',
        selected: 'rgb(238,238,238)',
        disabled: 'rgba(255, 255, 255, 0.2)',
      },
      warningBackground: '#EAEB5E',
      warningText: '#666804',
      noticeText: '#fff',
      loadingScreenBackground: '#17191C',
      profileOverlayBackground: 'rgba(0,0,0,0.3)',
      searchTextColor: '#000000',
      transparent: 'rgba(0,0,0,0)',
      facebookBtnBackground: '#44619D',
      joinBtnBackground: '#00aeef',
      loginTextColor: '#000000',
      black: 'black',
      beatmakerAvatarBackground: '#121316',
    },
  },
}
