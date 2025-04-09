import { useEffect, useState } from 'react'
// Use React's built-in hooks instead of relying on Recoil internals
import { RecoilState } from 'recoil'

type SetState<T> = (oldState: T) => T

export interface PersistedAtomState<T> {
  state: T | null
  setState?: (newState: T | SetState<T>) => void
  resetState?: () => void
  loadingLocalStorage: boolean
}

// Safe implementation that doesn't rely on React or Recoil internals
export const usePersistedRecoilState = <T>(
  atom: RecoilState<T>,
): PersistedAtomState<T> => {
  // Use vanilla React state instead of Recoil state to avoid React internal API issues
  const [value, setValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load the initial value from the atom (carefully)
  useEffect(() => {
    try {
      // Try to get the value safely - this requires client-side rendering
      const savedValue = localStorage.getItem(`recoil-persist-${atom.key}`);
      if (savedValue !== null) {
        const parsedValue = JSON.parse(savedValue);
        setValue(parsedValue);
      } else {
        // If no value in localStorage, use the atom's default value
        setValue((atom as any).default);
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      // Fallback to default if possible
      setValue((atom as any).default);
    } finally {
      setIsLoading(false);
    }
  }, [atom]);

  // Create state updater function
  const updateState = (newState: T | SetState<T>) => {
    setValue((prevState) => {
      const nextState = typeof newState === 'function' 
        ? (newState as SetState<T>)(prevState as T) 
        : newState;
      
      try {
        // Save to localStorage
        localStorage.setItem(`recoil-persist-${atom.key}`, JSON.stringify(nextState));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      return nextState;
    });
  };

  // Create reset function
  const resetState = () => {
    try {
      localStorage.removeItem(`recoil-persist-${atom.key}`);
      setValue((atom as any).default);
    } catch (error) {
      console.error('Error resetting state:', error);
    }
  };

  return {
    state: value,
    setState: updateState,
    resetState,
    loadingLocalStorage: isLoading,
  };
}
