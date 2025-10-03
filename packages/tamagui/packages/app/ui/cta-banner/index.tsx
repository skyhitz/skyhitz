'use client'
import { H2, P } from 'app/design/typography'
import { YStack, XStack } from 'tamagui'
import { SolitoImage } from 'app/design/solito-image'
import { TextLink } from 'app/navigation'
import { Button } from 'app/design/button'

export default function CtaBanner({
  title,
  subtitle,
  desc,
  cta,
}: {
  title: string
  subtitle: string
  desc: string
  cta: string
}) {
  return (
    <YStack position="relative">
      <YStack
        position="relative"
        height={320}
        overflow="hidden"
        $md={{
          position: 'absolute',
          left: 0,
          height: '100%',
          width: '33.333%',
        }}
        $lg={{
          width: '50%',
        }}
      >
        <YStack height="100%" width="100%" borderRadius="$10">
          <SolitoImage
            src="https://skyhitz.io/img/landing-3.webp"
            fill
            alt="Skyhitz Mission"
            contentFit="cover"
            style={{ borderTopRightRadius: 12, borderBottomRightRadius: 12 }}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </YStack>
      </YStack>
      
      <YStack
        position="relative"
        marginHorizontal="auto"
        width="100%"
        maxWidth={1280}
        paddingBottom={0}
        paddingTop="$14"
        $sm={{ paddingVertical: '$14' }}
        $lg={{ paddingHorizontal: '$8', paddingVertical: '$14' }}
        id="mission"
      >
        <YStack
          paddingHorizontal="$6"
          $md={{
            marginLeft: 'auto',
            width: '66.666%',
            paddingLeft: '$14',
          }}
          $lg={{
            width: '50%',
            paddingLeft: '$14',
            paddingRight: 0,
          }}
          $xl={{
            paddingLeft: '$16',
          }}
        >
          <P
            color="$blue9"
            fontSize="$4"
            fontWeight="600"
            lineHeight="$7"
            textTransform="uppercase"
            letterSpacing={1}
          >
            {subtitle}
          </P>
          
          <H2
            marginTop="$2"
            fontSize="$9"
            fontWeight="bold"
            letterSpacing={-1}
            $sm={{ fontSize: '$10' }}
          >
            {title}
          </H2>
          
          <P
            marginTop="$6"
            lineHeight="$8"
            color="$color11"
            fontSize="$5"
          >
            {desc}
          </P>
          
          <YStack marginTop="$8">
            <TextLink href="/chart">
              <Button
                text={cta}
                onPress={() => {}}
                variant="primary"
              />
            </TextLink>
          </YStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
