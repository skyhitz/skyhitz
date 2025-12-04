import { P } from 'app/design/typography'
import { SkyhitzLogo } from 'app/ui/logo'
import { useUserState } from 'app/state/user/hooks'
import { View } from 'react-native'
import { Link } from 'solito/link'
import { memo, useEffect } from 'react'
import { useRouter } from 'solito/navigation'

// Memoize navbar to prevent re-renders when children change
export const Navbar = memo(({ className }: { className?: string }) => {
  const { user, loading: userLoading } = useUserState()
  const router = useRouter()
  
  // Prefetch auth routes for faster navigation
  useEffect(() => {
    if (!user && !userLoading) {
      router.prefetch('/sign-in')
      router.prefetch('/sign-up')
    }
  }, [user, userLoading, router])

  return (
    <View
      className={`w-full flex-row flex-wrap items-center justify-between p-3 ${className}`}
    >
      <View className="flex flex-row">
        <Link href="/">
          <View className="flex flex-row items-center justify-start">
            <View className="flex min-h-[2.25rem] flex-row items-center">
              <SkyhitzLogo id="navbar" />
              <P className="font-raleway pl-4 text-sm tracking-[12px] text-[--logo-color] sm:text-lg">
                SKYHITZ
              </P>
            </View>
          </View>
        </Link>
      </View>
      {user || userLoading ? null : (
        <View className="flex-row items-center justify-end sm:flex">
          <View className="mr-4">
            <Link href="/sign-in">
              <P className="font-raleway tracking-0.5 text-sm font-bold">
                Log in
              </P>
            </Link>
          </View>

          <View className="bg-blue rounded-lg px-3 py-2">
            <Link href="/sign-up">
              <P className="font-raleway tracking-0.5 p-2 text-sm font-bold text-white">
                Sign Up
              </P>
            </Link>
          </View>
        </View>
      )}
    </View>
  )
})

Navbar.displayName = 'Navbar'
