'use client'
import * as React from 'react'
import { YStack, XStack } from 'tamagui'
import { H2, P } from 'app/design/typography'
import { SolitoImage } from 'app/design/solito-image'

export function Featured({ title, subtitle, features = [], imgUrl }: any) {
  return (
    <YStack paddingVertical="$16" backgroundColor="$background" overflow="hidden">
      <YStack marginHorizontal="auto" maxWidth={1280} paddingHorizontal="$6" $lg={{ paddingHorizontal: '$8' }}>
        <XStack
          flexDirection="column"
          gap="$14"
          $lg={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: '$8',
          }}
        >
          <YStack
            paddingHorizontal="$6"
            $lg={{
              paddingHorizontal: 0,
              paddingRight: '$4',
              paddingTop: '$4',
            }}
          >
            <YStack
              marginHorizontal="auto"
              maxWidth={640}
              $lg={{
                marginHorizontal: 0,
                maxWidth: 512,
              }}
            >
              <P
                color="$blue9"
                fontWeight="600"
                fontSize="$4"
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

              <YStack marginTop="$10" maxWidth={576} gap="$8" $lg={{ maxWidth: 'auto' }}>
                {features.map((feature: any) => (
                  <XStack
                    key={feature.name}
                    position="relative"
                    alignItems="center"
                    paddingLeft="$9"
                  >
                    <YStack position="absolute" left={0} top={4}>
                      <YStack height={20} width={20}>
                        {feature.icon &&
                          feature.icon({
                            color: 'var(--text-color)',
                            fill: 'var(--text-color)',
                            stroke: 'var(--text-color)',
                          })}
                      </YStack>
                    </YStack>
                    
                    <YStack position="relative" maxWidth="fit-content" paddingLeft="$1">
                      <P fontWeight="600" lineHeight="$8" color="$color">
                        {feature.name}
                      </P>
                      <P lineHeight="$8" color="$color11">
                        {feature.desc}
                      </P>
                    </YStack>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </YStack>
          
          <YStack
            marginHorizontal="auto"
            aspectRatio={1}
            width="100%"
            maxWidth={512}
            $lg={{
              aspectRatio: 9 / 14,
              paddingHorizontal: 0,
            }}
          >
            <SolitoImage
              src={imgUrl}
              alt="Music Features"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              contentFit="cover"
              style={{ borderRadius: 16 }}
            />
          </YStack>
        </XStack>
      </YStack>
    </YStack>
  )
}
