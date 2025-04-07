import { View } from 'react-native'
import { H2, P } from 'app/design/typography'
import { FeaturedProps } from 'app/types'
import { SolitoImage } from 'app/design/solito-image'

export function Featured({ title, subtitle, features, imgUrl }: FeaturedProps) {
  return (
    <View className="overflow-hidden bg-white py-32">
      <View className="mx-auto max-w-7xl md:px-6 lg:px-8">
        <View className="grid grid-cols-1 gap-x-8 gap-y-24 lg:grid-cols-2 lg:items-center">
          <View className="px-6 lg:px-0 lg:pr-4 lg:pt-4">
            <View className="mx-auto max-w-2xl lg:mx-0 lg:max-w-lg">
              <P className="text-blue-brand font-semibold leading-7">
                {subtitle}
              </P>
              <H2 className="font-unbounded mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </H2>

              <View className="mt-10 max-w-xl space-y-8 text-base leading-7 lg:max-w-none">
                {features.map((feature) => (
                  <View
                    key={feature.name}
                    className="relative flex flex-row items-center pl-9"
                  >
                    <View className="h-5 w-5 text-black">
                      {feature.icon && feature.icon({})}
                    </View>
                    <View className="relative max-w-fit pl-9">
                      <P className="font-semibold leading-8">{feature.name}</P>
                      <P className="inline leading-8">{feature.desc}</P>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View className="mx-auto aspect-square w-full max-w-lg lg:aspect-[9/14] lg:px-0">
            <SolitoImage
              src={'/img/landing-2.webp'}
              alt="Music Features"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              contentFit="cover"
              // @ts-ignore
              className="aspect-square rounded-2xl lg:aspect-[9/14]"
            />
          </View>
        </View>
      </View>
    </View>
  )
}
