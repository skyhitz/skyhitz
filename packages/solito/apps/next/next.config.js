const { DefinePlugin } = require('webpack')
const path = require('path')
const dotenv = require('dotenv')

// Load environment variables from .env file using absolute path
const dotenvResult = dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

// Log environment loading for debugging
console.log('Environment variables loaded:', {
  path: path.resolve(__dirname, './.env'),
  loaded: dotenvResult.parsed ? 'yes' : 'no',
  env: process.env.NEXT_PUBLIC_EXPO_SKYHITZ_ENV,
})

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'react-native-reanimated',
    'moti',
    'react-native-gesture-handler',
    'react-native-safe-area-context',
    'nativewind',
    'react-native-css-interop',
    'app',
    // SVG needs special handling
    'react-native-svg',
    'react-native-htmlview',
    '@react-native-community',
    'expo-clipboard',
    'expo-modules-core',
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

  // reanimated doesn't support strict mode on web
  reactStrictMode: false,

  // Configure webpack properly for React Native Web
  webpack: (config, options) => {
    // Add alias for react-native to react-native-web
    if (!config.resolve) {
      config.resolve = {}
    }

    // Fix for the @react-native/assets-registry TypeScript issue
    // Create a stub for the problematic module
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Alias direct react-native imports to react-native-web
      'react-native$': 'react-native-web',
      // Create a custom resolver for the assets-registry module
      '@react-native/assets-registry/registry': path.resolve(
        __dirname,
        './registry-stub.js'
      ),
      // Alias internal react-native modules to react-native-web
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$':
        'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter',
    }

    // Ensure proper extensions for web
    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.mjs',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
      '.wasm',
      ...(config.resolve.extensions || []),
    ]

    // Expose __DEV__ from Metro
    if (!config.plugins) {
      config.plugins = []
    }

    config.plugins.push(
      new DefinePlugin({
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      })
    )

    return config
  },
}
