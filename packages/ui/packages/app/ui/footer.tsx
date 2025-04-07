import { A, H3, P } from 'app/design/typography'
import { View } from 'react-native'
import { SkyhitzLogo } from 'app/ui/logo'
import { footer } from 'app/constants/content'

export default function Footer() {
  const { companyName, sections } = footer
  return (
    <View className="mx-auto w-full max-w-7xl px-6 pb-12 lg:px-8">
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
                  <H3 className="text-sm font-semibold leading-6">{title}</H3>
                  <View role="list" className="mt-6 space-y-4">
                    {links.map((item) => (
                      <View key={item.name}>
                        <A
                          href={item.href}
                          role="link"
                          className="text-sm leading-6 text-gray-600 hover:text-gray-900"
                        >
                          {item.name}
                        </A>
                      </View>
                    ))}
                  </View>
                </View>
              )
            },
          )}
        </View>
      </View>
      <P className="mt-16 flex flex-row items-center gap-4 text-xs">
        <SkyhitzLogo size={25} id="footer" /> © {new Date().getFullYear()}{' '}
        {companyName} - All Rights Reserved.
      </P>
    </View>
  )
}
