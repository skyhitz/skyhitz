// @ts-check

/** @type {import('tailwindcss').Config['theme']} */
const theme = {
  // edit your tailwind theme here!
  // https://tailwindcss.com/docs/adding-custom-styles
  extend: {
    fontFamily: {
      inter: ['var(--font-inter)'],
      raleway: ['var(--font-raleway)'],
      unbounded: ['var(--font-unbounded)'],
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

module.exports = {
  theme,
}
