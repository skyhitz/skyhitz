'use client'
import { YStack } from 'tamagui'
import { P } from 'app/design/typography'

export default function BeatmakersEmptyState() {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$8">
      <P textAlign="center" color="$gray9">
        Search for collectors by name or username
      </P>
    </YStack>
  )
}
