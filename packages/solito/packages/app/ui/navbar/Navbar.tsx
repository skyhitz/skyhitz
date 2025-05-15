import { P } from 'app/design/typography'
import { SkyhitzLogo } from 'app/ui/logo'
import { useUserState } from 'app/state/user/hooks'
import { View } from 'react-native'
import { TextLink } from 'solito/link'

export const Navbar = ({ className }: { className?: string }) => {
  const { user, loading: userLoading } = useUserState()

  return (
    <View
      className={`w-full flex-row flex-wrap items-center justify-between p-3 ${className}`}
    >
      <View className="flex flex-row">
        <TextLink href="/">
          <View className="flex flex-row items-center justify-start">
            <View className="flex min-h-[2.25rem] flex-row items-center">
              <SkyhitzLogo id="navbar" />
              <P className="font-raleway pl-4 text-sm tracking-[12px] text-gray-600 sm:text-lg">
                SKYHITZ
              </P>
            </View>
          </View>
        </TextLink>
        {user || userLoading ? null : (
          <View className="ml-8 hidden flex-row items-center sm:flex">
            <TextLink href="/chart">
              <P className="mr-4 text-sm">Chart</P>
            </TextLink>
            <TextLink href="/search">
              <P className="mr-4 text-sm">Search</P>
            </TextLink>
          </View>
        )}
      </View>
      {user || userLoading ? null : (
        <View className="flex-row items-center justify-end sm:flex">
          <TextLink href="/sign-in">
            <P className="font-raleway tracking-0.5 mr-4 text-sm font-bold">
              Log in
            </P>
          </TextLink>

          <View className="bg-blue rounded-lg px-3 py-2">
            <TextLink href="/sign-up">
              <P className="font-raleway tracking-0.5 p-2 text-sm font-bold text-white">
                Sign Up
              </P>
            </TextLink>
          </View>
        </View>
      )}
    </View>
  )
}
