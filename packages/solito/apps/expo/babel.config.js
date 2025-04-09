module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      [
        'babel-preset-expo',
        { jsxRuntime: 'automatic', jsxImportSource: 'nativewind' },
      ],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  }
}
