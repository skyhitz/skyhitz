'use client'
import { A, H1, P } from 'app/design/typography'
import { YStack, XStack } from 'tamagui'
import { SolitoImage } from 'app/design/solito-image'
import { TextLink } from 'solito/link'
import { useUserState } from 'app/state/user/hooks'
import { Button } from 'app/design/button'

export interface HeroProps {
  title: string
  desc: string
}

export const Hero = ({ title, desc }: HeroProps) => {
  const { user } = useUserState()

  return (
    <XStack
      maxWidth={1280}
      marginHorizontal="auto"
      paddingHorizontal="$6"
      paddingTop="$8"
      width="100%"
      flexDirection="column"
      $md={{ flexDirection: 'row' }}
      gap="$10"
      $lg={{ paddingHorizontal: '$8' }}
    >
      <YStack
        flex={1}
        maxWidth={640}
        marginHorizontal="auto"
        $lg={{ marginHorizontal: 0 }}
      >
        <H1
          marginTop="$10"
          maxWidth={512}
          fontSize="$10"
          fontWeight="bold"
          lineHeight="$11"
          letterSpacing={-1}
          $sm={{ fontSize: "$11" }}
        >
          {title}
        </H1>
        
        <P
          marginTop="$6"
          lineHeight="$8"
          color="$color11"
          fontSize="$5"
        >
          {desc}
        </P>
        
        <XStack marginTop="$10" gap="$6" alignItems="center">
          <TextLink href={user ? '/chart' : '/sign-up'}>
            <Button
              text="Get started"
              onPress={() => {}}
              variant="primary"
            />
          </TextLink>
          
          <A href="#mission">
            <P fontSize="$3" fontWeight="600" lineHeight="$6">
              Learn more →
            </P>
          </A>
        </XStack>
      </YStack>
      
      <YStack
        flex={1}
        minHeight={610}
        position="relative"
        marginVertical="$8"
        $md={{ marginVertical: 0 }}
      >
        <SolitoImage
          src="/img/app.webp"
          alt="Skyhitz app"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          contentFit="contain"
        />
      </YStack>
    </XStack>
  )
}
