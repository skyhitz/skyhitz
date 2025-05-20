'use client'
import { A, H3, P } from 'app/design/typography'
import { View } from 'react-native'
import { SkyhitzLogo } from 'app/ui/logo'
import { footer } from 'app/constants/content'
import ThemeSwitcher from '../ThemeSwitcher'

export default function Footer({ className }: { className?: string }) {
  const { companyName, sections } = footer
  return (
    <View
      className={`mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8 ${className}`}
    >
      <View className="xl:grid xl:grid-cols-2 xl:gap-8">
        <View />
        <View className="gap-8 sm:grid sm:grid-cols-3">
          {sections.map(
            ({
              title,
              links,
            }: {
              title: string
              links: { name: string; href: string }[]
            }) => {
              return (
                <View key={title}>
                  <H3 className="text-sm font-semibold leading-6 text-[--text-color]">
                    {title}
                  </H3>
                  <View role="list" className="mt-6 space-y-4">
                    {links.map((item) => (
                      <View key={item.name}>
                        <A
                          href={item.href}
                          role="link"
                          className="text-sm leading-6 hover:opacity-80 text-[--text-color]"
                        >
                          {item.name}
                        </A>
                      </View>
                    ))}
                  </View>
                </View>
              )
            }
          )}
        </View>
      </View>

      <View className="flex flex-row items-center justify-between mt-16">
        <View className="flex flex-row items-center gap-4">
          <SkyhitzLogo size={25} id="footer" />
          <P className="text-xs text-[--text-color]">
            © {new Date().getFullYear()} {companyName} - All Rights Reserved.
          </P>
        </View>
        <ThemeSwitcher />
      </View>
    </View>
  )
}
