import { A, H3, P } from 'app/design/typography'
import { formattedDate } from 'app/utils'
import { View } from 'react-native'
import { SolitoImage } from 'app/design/solito-image'

export default function Card({
  imageUrl = '/img/landing-3.webp',
  publishedAtTimestamp = 0,
  tag = 'Business',
  content = 'We are proud to anounce that we reached an historical revenue, great news for the music industry',
  title = 'Skyhitz reaches 20M MRR',
  slug = 'skyhitz-reaches',
}) {
  const summary = content.replace(/<\/?[^>]+(>|$)/g, '')
  return (
    <A href={`/blog/${slug}`}>
      <View className="flex shrink flex-col items-start justify-between rounded-xl shadow-lg">
        <View className="relative w-full">
          <View className="aspect-[3/2] w-full object-cover">
            <SolitoImage
              src={imageUrl}
              alt={title}
              fill
              contentFit="cover"
              style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          </View>
        </View>
        <View className="max-w-xl px-6 py-8">
          <View className="group relative">
            <H3 className="line-clamp-2 min-h-[3rem] text-lg font-semibold leading-6 group-hover:text-gray-600">
              <View className="absolute inset-0" />
              {title}
            </H3>
            <View className="bg-blue-brand/20 relative z-10 mt-5 w-min rounded-full px-3 py-1  hover:bg-gray-100">
              <P className="font-inter text-xs font-medium capitalize text-gray-600">
                {tag}
              </P>
            </View>
            <P className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
              {summary}
            </P>
          </View>
          <View className="mt-5 flex items-start gap-4">
            <P className="text-xs font-bold text-gray-700">
              {formattedDate(publishedAtTimestamp)}
            </P>
          </View>
        </View>
      </View>
    </A>
  )
}
