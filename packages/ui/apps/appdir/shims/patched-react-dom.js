/**
 * This is a patched version of react-dom to support react-native-web
 * which depends on methods that were removed in newer React versions.
 */

// Import the real react-dom
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Re-export everything
export * from 'react-dom';

// Create explicit client module property to support import from 'react-dom/client'
ReactDOM.client = ReactDOMClient;

// Make sure exports from 'react-dom/client' are available
export const createRoot = ReactDOMClient.createRoot;
export const hydrateRoot = ReactDOMClient.hydrateRoot;

// Add legacy methods back
export const hydrate = function hydrate(element, container, callback) {
  console.log('[Patched] Using hydrateRoot instead of hydrate');
  try {
    const root = ReactDOMClient.hydrateRoot(container, element);
    if (callback) callback();
    // For compatibility with code expecting a different return value
    return {
      _internalRoot: root
    };
  } catch (e) {
    console.error('[Patched react-dom] Hydrate error, falling back to render:', e);
    // Fallback to render
    render(element, container, callback);
    return null;
  }
};

export const render = function render(element, container, callback) {
  console.log('[Patched] Using createRoot instead of render');
  try {
    const root = ReactDOMClient.createRoot(container);
    root.render(element);
    if (callback) callback();
    container._reactRootContainer = root;
    return {
      _internalRoot: root
    };
  } catch (e) {
    console.error('[Patched react-dom] Render error:', e);
    throw e;
  }
};

export const unmountComponentAtNode = function unmountComponentAtNode(container) {
  console.log('[Patched] Using unmount instead of unmountComponentAtNode');
  try {
    if (!container) return false;
    
    if (container._reactRootContainer) {
      container._reactRootContainer.unmount();
      delete container._reactRootContainer;
      return true;
    }
    
    // Look for React 18 root identifiers
    const rootKey = Object.keys(container).find(key => key.startsWith('__reactContainer$'));
    if (rootKey) {
      if (container[rootKey]._internalRoot) {
        container[rootKey]._internalRoot.unmount();
      } else if (typeof container[rootKey].unmount === 'function') {
        container[rootKey].unmount();
      }
      delete container[rootKey];
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('[Patched react-dom] UnmountComponentAtNode error:', e);
    return false;
  }
};

// Re-export the default
export default ReactDOM;
