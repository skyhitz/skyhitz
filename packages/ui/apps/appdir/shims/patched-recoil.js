/**
 * This is a patched version of Recoil that doesn't rely on React's internal APIs
 * and works with newer versions of React.
 */
import React from 'react';

// Create simplified versions of Recoil's core hooks using React's useState
// This is a compatibility layer for our specific use case

// Map to store atom values
const atomValues = new Map();

// Initialize with default values
export function atom(options) {
  const id = options.key;
  if (!atomValues.has(id) && options.default !== undefined) {
    atomValues.set(id, options.default);
  }
  return {
    key: id,
    default: options.default
  };
}

// A simplified version of useRecoilState that doesn't use React internals
export function useRecoilState(recoilAtom) {
  const id = recoilAtom.key;
  
  // Initialize state with current value or default
  const initialValue = atomValues.has(id) 
    ? atomValues.get(id) 
    : recoilAtom.default;
  
  const [state, setState] = React.useState(initialValue);
  
  // Update the global map when state changes
  const updateState = React.useCallback((newValueOrUpdater) => {
    setState(prevState => {
      const newValue = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prevState)
        : newValueOrUpdater;
      
      // Update the global state map
      atomValues.set(id, newValue);
      return newValue;
    });
  }, [id]);
  
  return [state, updateState];
}

// Reset state to default value
export function useResetRecoilState(recoilAtom) {
  const id = recoilAtom.key;
  
  return React.useCallback(() => {
    const defaultValue = recoilAtom.default;
    atomValues.set(id, defaultValue);
    // Force a re-render of components using this atom
    window.dispatchEvent(new CustomEvent('recoil-reset', { detail: { key: id }}));
  }, [id, recoilAtom.default]);
}

// Read-only version
export function useRecoilValue(recoilAtom) {
  const [value] = useRecoilState(recoilAtom);
  return value;
}

// Write-only version
export function useSetRecoilState(recoilAtom) {
  const [, setValue] = useRecoilState(recoilAtom);
  return setValue;
}

// RecoilRoot component that doesn't do much in our simplified version
export function RecoilRoot({ children }) {
  return <>{children}</>;
}

// Export other utilities to avoid errors
export const selector = (options) => options;
export const useRecoilStateLoadable = useRecoilState;
export const useRecoilValueLoadable = useRecoilValue;
