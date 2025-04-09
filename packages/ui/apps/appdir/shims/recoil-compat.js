/**
 * Compatibility layer for Recoil with React 19
 * Handles the issue with React internal API changes
 */
import React from 'react';
import * as OriginalRecoil from 'recoil';

// Create a patched version of useRecoilState that doesn't rely on the React internal APIs
// This is a simplified implementation that should work for basic cases
export const useRecoilState = (atom) => {
  console.log('[Recoil Compat] Using patched useRecoilState');
  try {
    // Try the original implementation first
    return OriginalRecoil.useRecoilState(atom);
  } catch (error) {
    // If it fails, use a fallback implementation based on React's useState
    console.warn('[Recoil Compat] Falling back to useState-based implementation due to:', error.message);
    const [state, setState] = React.useState(atom.default !== undefined ? atom.default : null);
    
    // Create a setter that attempts to follow Recoil's behavior
    const setValue = React.useCallback((newValueOrUpdater) => {
      setState(prev => {
        if (typeof newValueOrUpdater === 'function') {
          return newValueOrUpdater(prev);
        }
        return newValueOrUpdater;
      });
    }, []);
    
    return [state, setValue];
  }
};

// Create a patched version of useResetRecoilState
export const useResetRecoilState = (atom) => {
  console.log('[Recoil Compat] Using patched useResetRecoilState');
  try {
    // Try the original implementation first
    return OriginalRecoil.useResetRecoilState(atom);
  } catch (error) {
    // If it fails, use a fallback implementation based on React's useState
    console.warn('[Recoil Compat] Falling back to basic implementation due to:', error.message);
    const [, setState] = React.useState();
    
    // Create a reset function that sets to default value
    return React.useCallback(() => {
      setState(atom.default !== undefined ? atom.default : null);
    }, [atom]);
  }
};

// Re-export all other Recoil exports
export * from 'recoil';

// Override the specific exports that need patching
OriginalRecoil.useRecoilState = useRecoilState;
OriginalRecoil.useResetRecoilState = useResetRecoilState;

// Export default
export default OriginalRecoil;
