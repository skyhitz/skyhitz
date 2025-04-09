const { DefinePlugin } = require('webpack')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Preload our patch to fix React DOM and Recoil issues
require('./module-patch');

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
    '@expo/vector-icons',
    'expo-router',
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
    // Add our custom loader to transform react-native-web modules during build
    const { rules } = config.module;
    
    // Create a loader rule for react-native-web files
    const reactNativeWebLoader = {
      test: /\.(js|jsx|ts|tsx)$/,
      include: /node_modules\/react-native-web/,
      use: [
        {
          loader: require.resolve('./loaders/react-native-web-patch-loader.js'),
        },
      ],
    };
    
    // Add to the beginning of the rules array to ensure it runs first
    config.module.rules.unshift(reactNativeWebLoader)
    
    const { isServer } = options
    // Mix in aliases
    if (!config.resolve) {
      config.resolve = {}
    }

    // Add fallbacks for React Native modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'react-native': 'react-native-web',
        'react-native-svg': 'react-native-svg-web',
        'moti/skeleton': 'moti/skeleton',
      }
    }

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      
      // Core alias for react-native-web - CRITICAL for Next.js to work
      'react-native$': 'react-native-web',
      
      // Directly patch react-native-web modules that rely on removed React DOM methods
      'react-native-web/dist/exports/render/index.js': require.resolve('./patches/render-patch.js'),
      'react-native-web/dist/exports/unmountComponentAtNode/index.js': require.resolve('./patches/unmount-patch.js'),
      
      // Essential shims for web compatibility that were working in the previous version
      'moti/build/components/image': require.resolve('./shims/moti-image.js'),
      'react-native-reanimated': require.resolve('./shims/react-native-reanimated.js'),
      'expo-av': require.resolve('./shims/expo-av.js'),
      'react-native-svg': require.resolve('./shims/react-native-svg.js'),
      
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
