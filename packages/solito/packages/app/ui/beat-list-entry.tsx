'use client'
import { Text, View, Image, Pressable } from 'react-native'
import { Entry } from 'app/api/graphql/types'
import { P } from 'app/design/typography'
import { formatToUSCurrency } from 'app/utils/format'
import { imageSrc } from 'app/utils/entry'
import { useRouter } from 'solito/navigation'

type BeatListEntryProps = {
  entry: Entry
  playlist?: Entry[]
}

export function BeatListEntry({ entry, playlist }: BeatListEntryProps) {
  const { push } = useRouter()
  
  const handlePress = () => {
    push(`/dashboard/beat/${entry.id}`)
  }

  return (
    <Pressable
      onPress={handlePress}
      className="mb-4 flex-row items-center rounded-lg bg-gray-800 p-2"
    >
      <Image
        source={{ uri: imageSrc(entry.imageUrl) }}
        className="h-14 w-14 rounded"
        alt={entry.title || 'Entry'}
      />

      <View className="ml-3 flex-1">
        <Text numberOfLines={1} className="text-base font-medium text-white">
          {entry.title}
        </Text>
        <Text numberOfLines={1} className="text-sm text-gray-400">
          {entry.artist}
        </Text>
      </View>

      {(entry.tvl || entry.apr) && (
        <View className="items-end">
          {entry.tvl && (
            <P className="text-sm text-gray-300">
              TVL: {formatToUSCurrency(entry.tvl)}
            </P>
          )}
          {entry.apr && (
            <P className="text-sm text-green-400">APR: {entry.apr.toFixed(2)}%</P>
          )}
        </View>
      )}
    </Pressable>
  )
}
