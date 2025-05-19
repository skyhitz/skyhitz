// Learn more https://docs.expo.dev/guides/monorepos
const path = require('path')
const { withNativeWind } = require('nativewind/metro')
const { getDefaultConfig } = require('@expo/metro-config')

// Define the project root and workspace root
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

// Create a config based on Expo's default
const config = getDefaultConfig(projectRoot)

// Configure for monorepo
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.disableHierarchicalLookup = true

// Fix for module resolution in monorepo
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot),
}

// Support NativeWind with the shared CSS file
const cssPath = path.resolve(workspaceRoot, 'packages/app/design/global.css')
module.exports = withNativeWind(config, { input: cssPath })
