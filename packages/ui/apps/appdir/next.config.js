const { DefinePlugin } = require('webpack')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * @type {import('next').NextConfig}
 */
module.exports = withBundleAnalyzer({
  async headers() {
    return [
      {
        source: '/.well-known/stellar.toml',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate', // No caching for dynamic content
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        destination: '/api/.well-known/apple-app-site-association',
        permanent: false,
      },
    ]
  },
  transpilePackages: [
    'react-native',
    'react-native-web',
    'expo-linking',
    'expo-av',
    'expo-asset',
    'expo-modules-core',
    'expo-image-picker',
    'expo-document-picker',
    'expo-intent-launcher',
    'solito',
    'moti',
    'app',
    'react-native-reanimated',
    'nativewind',
    'react-native-css-interop',
    'react-native-svg',
    'react-native-safe-area-context',
    'react-native-htmlview',
    '@react-native-community',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // webpack config forked from https://github.com/expo/expo-cli/blob/main/packages/next-adapter/src/index.ts
  webpack(config, options) {
    // Mix in aliases
    if (!config.resolve) {
      config.resolve = {}
    }

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Alias direct react-native imports to react-native-web
      'react-native$': 'react-native-web',
      // Alias internal react-native modules to react-native-web
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$':
        'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter',
    }

    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...(config.resolve?.extensions ?? []),
    ]

    if (!config.plugins) {
      config.plugins = []
    }

    // Expose __DEV__ from Metro.

    config.plugins.push(
      new DefinePlugin({
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      }),
    )

    return config
  },
})

require('dotenv').config({
  path: '../../.env',
})
