/**
 * Custom implementation of react-native-web render function for React 19 compatibility
 */
import * as ReactDOM from './react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Create a standard render implementation for react-native-web
export function render(element, container, callback) {
  console.log('[Custom RNW Shim] Using patched render');
  if (!container) {
    throw new Error('Container is required for render');
  }
  try {
    // Create a root using the createRoot API
    const root = ReactDOMClient.createRoot(container);
    root.render(element);
    // Store the root on the container for future reference
    container._reactRootContainer = root;
    // Execute callback if provided
    if (typeof callback === 'function') {
      callback();
    }
    return root;
  } catch (error) {
    console.error('[Custom RNW Shim] Error during render:', error);
    throw error;
  }
}

// Implementation of hydrate for server-side rendering support
export function hydrate(element, container, callback) {
  console.log('[Custom RNW Shim] Using patched hydrate');
  if (!container) {
    throw new Error('Container is required for hydrate');
  }
  try {
    // Create a hydrated root using hydrateRoot API
    const root = ReactDOMClient.hydrateRoot(container, element);
    // Store the root on the container for future reference
    container._reactRootContainer = root;
    // Execute callback if provided
    if (typeof callback === 'function') {
      callback();
    }
    return root;
  } catch (error) {
    console.error('[Custom RNW Shim] Error during hydration, falling back to render:', error);
    // Fallback to render if hydrate fails
    return render(element, container, callback);
  }
}

// Compatibility with react-native-web's API
export default render;
