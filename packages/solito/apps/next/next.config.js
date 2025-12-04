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
  // Configure external packages for server components
  serverExternalPackages: ['sharp'],
  
  // Enable compression for better performance
  compress: true,
  
  // Enable powered by header removal for smaller response
  poweredByHeader: false,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Enable experimental optimizations
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      '@apollo/client',
      'ramda',
      'moti',
      'solito',
      'react-native-reanimated',
    ],
  },
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
    'expo-modules-core',
    // Add expo-video and expo-audio for proper transpilation
    'expo-video',
    'expo-audio',
    'expo-clipboard',
  ],
  images: {
    // Enable image optimization for production
    unoptimized: process.env.NODE_ENV === 'development',
    // Use webp format for better compression
    formats: ['image/avif', 'image/webp'],
    // Reasonable sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize CLS with lazy loading
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r2.skyhitz.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'skyhitz.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.nftstorage.link',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'audius.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.audius.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // reanimated doesn't support strict mode on web
  reactStrictMode: false,

  // Headers for caching and CORS
  async headers() {
    return [
      // CORS headers for stellar.toml
      {
        source: '/.well-known/stellar.toml',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/img/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache fonts aggressively
      {
        source: '/:path*.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache JS/CSS with validation
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirects from old dashboard routes to new simplified routes
  async redirects() {
    return [
      {
        source: '/dashboard/beat/:id',
        destination: '/music/:id',
        permanent: true,
      },
      {
        source: '/beat/:id',
        destination: '/music/:id',
        permanent: true,
      },
      {
        source: '/dashboard/chart',
        destination: '/chart',
        permanent: true,
      },
      {
        source: '/dashboard/profile',
        destination: '/profile',
        permanent: true,
      },
      {
        source: '/dashboard/profile/likes',
        destination: '/profile/likes',
        permanent: true,
      },
      {
        source: '/dashboard/profile/collection',
        destination: '/profile/collection',
        permanent: true,
      },
      {
        source: '/dashboard/profile/edit',
        destination: '/profile/edit',
        permanent: true,
      },
      {
        source: '/dashboard/search',
        destination: '/search',
        permanent: true,
      },
    ]
  },

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
