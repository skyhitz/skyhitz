import { A, H3, P } from 'app/design/typography'
import { formattedDate } from 'app/utils'
import { YStack, XStack, Image } from 'tamagui'
import { SolitoImage } from 'app/design/solito-image'
import { imageSrc } from 'app/utils/entry'

export default function Card({
  imageUrl = '/img/landing-3.webp',
  publishedAtTimestamp = 0,
  tag = 'Business',
  content = 'We are proud to announce that we reached an historical revenue, great news for the music industry',
  title = 'Skyhitz reaches 20M MRR',
  slug = 'skyhitz-reaches',
}) {
  const summary = content.replace(/<\/?[^>]+(>|$)/g, '')
  return (
    <A href={`/blog/${slug}`}>
      <YStack
        flexShrink={1}
        borderRadius="$4"
        shadowColor="$shadowColor"
        shadowRadius="$4"
        shadowOffset={{ width: 0, height: 2 }}
        overflow="hidden"
        backgroundColor="$color2"
        hoverStyle={{ transform: [{ scale: 1.02 }] }}
        pressStyle={{ opacity: 0.9 }}
        cursor="pointer"
      >
        <YStack position="relative" width="100%">
          <YStack aspectRatio={3 / 2} width="100%">
            <SolitoImage
              src={imageSrc(imageUrl)}
              alt={title}
              fill
              contentFit="cover"
              style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          </YStack>
        </YStack>
        
        <YStack maxWidth={576} padding="$6">
          <YStack position="relative">
            <H3
              fontSize="$5"
              fontWeight="600"
              lineHeight="$6"
              numberOfLines={2}
              minHeight={48}
              hoverStyle={{ color: '$color11' }}
            >
              {title}
            </H3>
            
            <XStack
              marginTop="$5"
              backgroundColor="$blue9"
              opacity={0.2}
              borderRadius="$10"
              paddingHorizontal="$3"
              paddingVertical="$1"
              alignSelf="flex-start"
              hoverStyle={{ backgroundColor: '$color3' }}
            >
              <P
                fontSize="$2"
                fontWeight="500"
                textTransform="capitalize"
                color="$color11"
              >
                {tag}
              </P>
            </XStack>
            
            <P
              marginTop="$5"
              fontSize="$3"
              lineHeight="$6"
              numberOfLines={3}
              color="$color11"
            >
              {summary}
            </P>
          </YStack>
          
          <XStack marginTop="$5" gap="$4" alignItems="flex-start">
            <P fontSize="$2" fontWeight="bold" color="$color10">
              {formattedDate(publishedAtTimestamp)}
            </P>
          </XStack>
        </YStack>
      </YStack>
    </A>
  )
}
