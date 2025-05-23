import { usePathname as useExpoPathname } from 'expo-router'

export const usePathname = () => {
  return useExpoPathname()
}
