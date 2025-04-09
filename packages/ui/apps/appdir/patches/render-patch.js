/**
 * This is a direct patch for react-native-web's render module
 * that doesn't rely on the removed methods from React DOM
 */
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Create our own implementation of the render function
export function render(element, root, callback) {
  console.log('[Patched] Using createRoot instead of legacy render');
  const reactRoot = ReactDOMClient.createRoot(root);
  reactRoot.render(element);
  if (typeof callback === 'function') {
    callback();
  }
  return reactRoot;
}

// Create our own implementation of the hydrate function
export function hydrate(element, root, callback) {
  console.log('[Patched] Using hydrateRoot instead of legacy hydrate');
  const reactRoot = ReactDOMClient.hydrateRoot(root, element);
  if (typeof callback === 'function') {
    callback();
  }
  return reactRoot;
}

// Store roots for unmounting
const roots = new Map();

// Export a default for CommonJS compatibility
export default { render, hydrate };
