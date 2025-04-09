/**
 * This is a patched version of react-dom to support react-native-web
 * which depends on methods that were removed in newer React versions.
 */
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Re-export everything from the original ReactDOM
Object.keys(ReactDOM).forEach((key) => {
  exports[key] = ReactDOM[key];
});

// Add back the missing methods that react-native-web needs
export const hydrate = function hydrate(element, container, callback) {
  console.log('[Patched] Using hydrateRoot instead of hydrate');
  const root = ReactDOMClient.hydrateRoot(container, element);
  if (typeof callback === 'function') callback();
  return root;
};

export const unmountComponentAtNode = function unmountComponentAtNode(container) {
  console.log('[Patched] Using modern approach instead of unmountComponentAtNode');
  if (!container) return false;
  
  try {
    // Try to find React 18 root container properties
    const rootKey = Object.keys(container).find(key => 
      key.startsWith('__reactContainer$') || 
      key.startsWith('_reactRootContainer')
    );
    
    if (rootKey) {
      if (typeof container[rootKey].unmount === 'function') {
        container[rootKey].unmount();
      }
      delete container[rootKey];
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('[Patched] Error unmounting component:', e);
    return false;
  }
};

// Also export a default for CommonJS compatibility
export default {
  ...ReactDOM,
  hydrate,
  unmountComponentAtNode
};
