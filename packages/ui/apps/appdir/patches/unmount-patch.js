/**
 * This is a direct patch for react-native-web's unmountComponentAtNode module
 * that doesn't rely on the removed method from React DOM
 */
import * as ReactDOM from 'react-dom';

// Map to store roots for proper cleanup
const rootsMap = new WeakMap();

// Create our own implementation of unmountComponentAtNode
export default function unmountComponentAtNode(container) {
  console.log('[Patched] Using modern approach for unmountComponentAtNode');
  
  if (!container) return false;
  
  try {
    // Look for React 18 root identifiers
    const rootKey = Object.keys(container).find(key => 
      key.startsWith('__reactContainer$') || 
      key.startsWith('_reactRootContainer')
    );
    
    if (rootKey) {
      // If we find a root, attempt to unmount it
      if (typeof container[rootKey].unmount === 'function') {
        container[rootKey].unmount();
      }
      delete container[rootKey];
      return true;
    }
    
    // Check for root in our map
    if (rootsMap.has(container)) {
      const root = rootsMap.get(container);
      root.unmount();
      rootsMap.delete(container);
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('[Patched] Error unmounting component:', e);
    return false;
  }
}
