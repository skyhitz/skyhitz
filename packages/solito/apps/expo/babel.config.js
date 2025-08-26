module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { 
        jsxImportSource: 'nativewind',
        unstable_transformImportMeta: true // Enable import.meta polyfill for Hermes
      }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  }
}
