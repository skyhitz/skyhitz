/**
 * This file contains patches for react-native-web to resolve issues with react-dom compatibility.
 * Enhanced for React 19 compatibility.
 */
module.exports = class ReactNativeWebPatchPlugin {
  apply(compiler) {
    compiler.hooks.normalModuleFactory.tap('ReactNativeWebPatchPlugin', (factory) => {
      // Intercept module requests for react-dom and redirect to our shim
      factory.hooks.beforeResolve.tap('ReactNativeWebPatchPlugin', (result) => {
        if (!result || !result.request) return result;
        
        // When react-native-web tries to import react-dom directly, redirect to our shim
        if (result.request === 'react-dom' && 
            result.context && 
            result.context.includes('react-native-web')) {
          // Rewrite the request to use our custom shim
          console.log('[ReactNativeWebPatchPlugin] Redirecting react-dom import to shim');
          result.request = require.resolve('../shims/react-dom.js');
        }
        
        return result;
      });
      
      // Patch specific modules that need transformation
      factory.hooks.afterResolve.tap('ReactNativeWebPatchPlugin', (result) => {
        if (!result || !result.resource) return result;
        
        // Patch imports in these specific modules
        if (result.resource.includes('react-native-web/dist/exports/render/index.js') ||
            result.resource.includes('react-native-web/dist/exports/unmountComponentAtNode/index.js') ||
            result.resource.includes('react-native-web/dist/exports/hydrate/index.js')) {
          
          console.log(`[ReactNativeWebPatchPlugin] Patching ${result.resource}`);
          // Add our loader to transform the source code
          result.loaders.push({
            loader: require.resolve('./react-native-web-loader.js'),
            options: {},
          });
        }
        
        return result;
      });
    });
  }
};
