'use client'
import { P } from 'app/design/typography'
import { SkyhitzLogo } from 'app/ui/logo'
import { useUserState } from 'app/state/user/hooks'
import { TextLink } from 'solito/link'
import { XStack, YStack, Button, GetProps } from 'tamagui'

const Navbar = (props: GetProps<typeof XStack>) => {
  const { user } = useUserState()
  const userLoading = false // We'll implement loading state later if needed

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
              <P
                fontFamily="$heading"
                paddingLeft="$4"
                fontSize="$4"
                letterSpacing="$2"
                color="$gray10"
                $sm={{ fontSize: '$5' }}
              >
                SKYHITZ
              </P>
            </XStack>
          </XStack>
        </TextLink>
        {user || userLoading ? null : (
          <XStack
            marginLeft="$8"
            display={{ xs: 'none', sm: 'flex' }}
            flexDirection="row"
            alignItems="center"
          >
            <TextLink href="/chart">
              <P marginRight="$4" fontSize="$3">Chart</P>
            </TextLink>
            <TextLink href="/search">
              <P marginRight="$4" fontSize="$3">Search</P>
            </TextLink>
          </XStack>
        )}
      </XStack>
      {user || userLoading ? null : (
        <XStack
          flexDirection="row"
          alignItems="center"
          justifyContent="flex-end"
          display={{ xs: 'none', sm: 'flex' }}
        >
          <TextLink href="/sign-in">
            <P
              fontFamily="$heading"
              letterSpacing="$1"
              marginRight="$4"
              fontSize="$3"
              fontWeight="bold"
            >
              Log in
            </P>
          </TextLink>

          <Button
            backgroundColor="$blue9"
            borderRadius="$3"
            paddingHorizontal="$3"
            paddingVertical="$2"
          >
            <TextLink href="/sign-up">
              <P
                fontFamily="$heading"
                letterSpacing="$1"
                padding="$2"
                fontSize="$3"
                fontWeight="bold"
                color="$white1"
              >
                Sign Up
              </P>
            </TextLink>
          </Button>
        </XStack>
      )}
    </XStack>
  )
}

export default Navbar
