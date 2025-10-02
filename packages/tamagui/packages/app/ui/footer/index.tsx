'use client'
import { A, H3, P } from 'app/design/typography'
import { SkyhitzLogo } from 'app/ui/logo'
import { footer } from 'app/constants/content'
import ThemeSwitcher from '../ThemeSwitcher'
import { YStack, XStack } from 'tamagui'

export default function Footer({ className }: { className?: string }) {
  const { companyName, sections } = footer
  return (
    <YStack
      marginHorizontal="auto"
      width="100%"
      maxWidth="$7xl"
      paddingHorizontal="$6"
      paddingBottom="$12"
      lg={{ paddingHorizontal: '$8' }}
      className={className}
    >
      <XStack xl={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '$8' }}>
        <YStack />
        <XStack
          gap="$8"
          sm={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {sections.map(
            ({
              title,
              links,
            }: {
              title: string
              links: { name: string; href: string }[]
            }) => {
              return (
                <YStack key={title}>
                  <H3
                    fontSize="$3"
                    fontWeight="600"
                    lineHeight="$6"
                    color="$color12"
                  >
                    {title}
                  </H3>
                  <YStack role="list" marginTop="$6" space="$4">
                    {links.map((item) => (
                      <YStack key={item.name}>
                        <A
                          href={item.href}
                          role="link"
                          fontSize="$3"
                          lineHeight="$6"
                          hoverStyle={{ opacity: 0.8 }}
                          color="$color12"
                        >
                          {item.name}
                        </A>
                      </YStack>
                    ))}
                  </YStack>
                </YStack>
              )
            }
          )}
        </XStack>
      </XStack>

      <XStack
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        marginTop="$16"
      >
        <XStack flexDirection="row" alignItems="center" gap="$4">
          <SkyhitzLogo size={25} id="footer" />
          <P
            fontSize="$2"
            color="$color12"
          >
            © {new Date().getFullYear()} {companyName} - All Rights Reserved.
          </P>
        </XStack>
        <ThemeSwitcher />
      </XStack>
    </YStack>
  )
}
