/**
 * Custom implementation of react-native-web unmountComponentAtNode for React 19 compatibility
 */
import * as ReactDOMClient from 'react-dom/client';

/**
 * Unmounts a React component from the specified container
 * Compatible with React 19 APIs
 */
export function unmountComponentAtNode(container) {
  console.log('[Custom RNW Shim] Using patched unmountComponentAtNode');
  if (!container) {
    return false;
  }
  
  try {
    // Check for React 19 roots format
    const rootKey = Object.keys(container).find(key => key.startsWith('__reactContainer$'));
    if (rootKey && container[rootKey]) {
      const root = container[rootKey];
      root.unmount();
      delete container[rootKey];
      return true;
    }
    
    // Check for stored root reference from our custom render
    if (container._reactRootContainer) {
      container._reactRootContainer.unmount();
      delete container._reactRootContainer;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Custom RNW Shim] Error during unmounting:', error);
    return false;
  }
}

export default unmountComponentAtNode;
