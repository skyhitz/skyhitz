/**
 * This file directly patches problematic modules at runtime
 * by overriding the Node.js module cache
 */

// This approach was particularly recommended in your previous sessions where we created shims
// for various libraries to ensure web compatibility

// Patch React DOM for hydrate and unmountComponentAtNode
const ReactDOM = require('react-dom');
const ReactDOMClient = require('react-dom/client');

// Add missing methods from React 18 removed in React 19
ReactDOM.hydrate = function hydrate(element, container, callback) {
  console.log('[Patched] Using hydrateRoot instead of hydrate');
  const root = ReactDOMClient.hydrateRoot(container, element);
  if (typeof callback === 'function') callback();
  return root;
};

ReactDOM.unmountComponentAtNode = function unmountComponentAtNode(container) {
  console.log('[Patched] Using unmount instead of unmountComponentAtNode');
  if (!container) return false;
  
  try {
    // Look for React 18 root identifiers
    const rootKey = Object.keys(container).find(key => key.startsWith('__reactContainer$'));
    if (rootKey) {
      if (typeof container[rootKey].unmount === 'function') {
        container[rootKey].unmount();
      }
      delete container[rootKey];
      return true;
    }
    
    if (container._reactRootContainer) {
      if (typeof container._reactRootContainer.unmount === 'function') {
        container._reactRootContainer.unmount();
      }
      delete container._reactRootContainer;
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('[Patched] Error unmounting component:', e);
    return false;
  }
};

// Make the patched version available to react-native-web
// by manipulating the module cache
const moduleCacheKey = require.resolve('react-dom');
require.cache[moduleCacheKey].exports = {
  ...ReactDOM,
  __esModule: true,
  default: ReactDOM
};

// Create a workaround for the Recoil issue by patching it
try {
  const originalRecoil = require('recoil');
  
  // We need to handle the case where Recoil tries to access React internals
  // Store maps for atoms
  const atomValues = new Map();
  
  // Override useRecoilState but maintain the original when possible
  const originalUseRecoilState = originalRecoil.useRecoilState;
  originalRecoil.useRecoilState = function patchedUseRecoilState(atom) {
    try {
      // Try the original first
      return originalUseRecoilState(atom);
    } catch (error) {
      // If it fails with internal React API error, use our fallback
      console.warn('[Recoil Patch] Using fallback implementation for useRecoilState');
      const React = require('react');
      const [state, setState] = React.useState(atom.default);
      return [state, setState];
    }
  };
  
  // Override useResetRecoilState but maintain the original when possible
  const originalUseResetRecoilState = originalRecoil.useResetRecoilState;
  originalRecoil.useResetRecoilState = function patchedUseResetRecoilState(atom) {
    try {
      // Try the original first
      return originalUseResetRecoilState(atom);
    } catch (error) {
      // If it fails, use our fallback
      console.warn('[Recoil Patch] Using fallback implementation for useResetRecoilState');
      const React = require('react');
      return React.useCallback(() => {
        // This is a simplified version that just returns a function that does nothing
        // since we can't actually reset state without the original implementation
        console.log('[Recoil Patch] Reset state called with fallback implementation');
      }, []);
    }
  };
  
  // Patch Recoil in the module cache
  const recoilModuleCacheKey = require.resolve('recoil');
  require.cache[recoilModuleCacheKey].exports = {
    ...originalRecoil,
    __esModule: true,
    default: originalRecoil
  };
  
} catch (error) {
  console.error('Failed to patch Recoil:', error);
}

// We don't need to export anything as this file's purpose is to run and patch modules
module.exports = {};
