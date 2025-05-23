import { usePathname as useNextPathname } from 'next/navigation'

export const usePathname = () => {
  return useNextPathname()
}
