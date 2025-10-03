import { P } from 'app/design/typography'
import { SkyhitzLogo } from 'app/ui/logo'
import { useUserState } from 'app/state/user/hooks'
import { XStack, YStack, GetProps } from 'tamagui'
import { TextLink } from 'app/navigation'

export const Navbar = (props: GetProps<typeof XStack>) => {
  const { user, loading: userLoading } = useUserState()

  return (
    <XStack
      width="100%"
      flexDirection="row"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="space-between"
      padding="$3"
      {...props}
    >
      <XStack flexDirection="row">
        <TextLink href="/">
          <XStack flexDirection="row" alignItems="center" justifyContent="flex-start">
            <XStack minHeight={36} flexDirection="row" alignItems="center">
              <SkyhitzLogo id="navbar" />
              <P fontFamily="$heading" paddingLeft="$4" fontSize="$3" letterSpacing={12} color="$blue9" $sm={{ fontSize: '$4' }}>
                SKYHITZ
              </P>
            </XStack>
          </XStack>
        </TextLink>
      </XStack>
      {user || userLoading ? null : (
        <XStack flexDirection="row" alignItems="center" justifyContent="flex-end" $sm={{ display: 'flex' }}>
          <YStack marginRight="$4">
            <TextLink href="/sign-in">
              <P fontFamily="$heading" letterSpacing={0.5} fontSize="$3" fontWeight="bold">
                Log in
              </P>
            </TextLink>
          </YStack>

          <YStack backgroundColor="$blue9" borderRadius="$3" paddingHorizontal="$3" paddingVertical="$2">
            <TextLink href="/sign-up">
              <P fontFamily="$heading" letterSpacing={0.5} padding="$2" fontSize="$3" fontWeight="bold" color="$white1">
                Sign Up
              </P>
            </TextLink>
          </YStack>
        </XStack>
      )}
    </XStack>
  )
}
