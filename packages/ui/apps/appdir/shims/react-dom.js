// Shim for react-dom to provide compatibility with react-native-web in React 19
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Re-export all existing exports
export * from 'react-dom';

// These exports must be defined before the default export to ensure they're available
// Add missing legacy methods that react-native-web depends on
export const hydrate = function hydrate(element, container, callback) {
  // Use hydrateRoot from React 19
  try {
    const root = ReactDOMClient.hydrateRoot(container, element);
    if (typeof callback === 'function') {
      callback();
    }
    return root;
  } catch (e) {
    console.error('Error during hydration:', e);
    // Fallback to render if hydrate fails
    const root = ReactDOMClient.createRoot(container);
    root.render(element);
    if (typeof callback === 'function') {
      callback();
    }
    return root;
  }
};

export const unmountComponentAtNode = function unmountComponentAtNode(container) {
  // This is an implementation of unmountComponentAtNode for React 19
  try {
    // If container has a __reactContainer$ property (React 19 format)
    const rootKey = Object.keys(container || {}).find(key => key.startsWith('__reactContainer$'));
    if (rootKey && container[rootKey]) {
      const root = container[rootKey];
      root.unmount();
      return true;
    } 
    // For React 19 roots created with createRoot
    if (container?._reactRootContainer) {
      const root = ReactDOMClient.createRoot(container);
      root.unmount();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error unmounting component:', e);
    return false;
  }
};

// Create a named function for render to help with debugging
export const render = function render(element, container, callback) {
  const root = ReactDOMClient.createRoot(container);
  root.render(element);
  if (typeof callback === 'function') {
    callback();
  }
  return root;
};

// Export default
export default ReactDOM;
