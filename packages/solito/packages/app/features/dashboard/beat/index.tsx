'use client'
import { useBeatParam } from 'app/hooks/param/useBeatParam'
import { Entry } from 'app/api/graphql/types'
import { ScrollView, View, Pressable } from 'react-native'
import { P } from 'app/design/typography'
import { useTheme } from 'app/state/theme/useTheme'
import { useThemeStore } from 'app/state/theme'
import Sun from 'app/ui/icons/sun'
import Moon from 'app/ui/icons/moon'
import { Details } from './BeatDetails'
import { imageUrlMedium } from 'app/utils/entry'
import { BeatSummaryColumn } from './BeatSummaryColumn'
import * as assert from 'assert'
import { pinataGateway } from 'app/constants/constants'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import Image from 'app/design/image'
import { PlayButton } from './PlayButton'
import { ActionButtons } from './ActionButtons'
import CreateBid from './bids/CreateBid'
import ClientLikesList from './ClientLikesList'

// BeatScreen component props
type Props = {
  entry?: Entry
}

const Content = ({ entry }: { entry: Entry }) => {
  const { colors, isDark } = useTheme()
  
  return (
    <View className="w-full" style={{ backgroundColor: colors.background }}>
      {/* Desktop layout (md and larger) */}
      <View className="hidden md:flex">
        <View className="w-full flex-row">
          {/* Left column with image */}
          <View className="mr-8 w-1/2">
            <View className="relative aspect-square w-full rounded-md">
              <Image
                source={{ uri: imageUrlMedium(entry.imageUrl) }}
                fill={true}
                alt={entry.title}
                style={{ borderRadius: 8 }}
                className="h-full w-full"
                width={500}
                height={500}
              />
            </View>

            {/* Details section below image */}
            <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
          </View>
          
          {/* Right column with title, controls, etc. */}
          <View className="flex w-1/2">
            <BeatSummaryColumn entry={entry} />
            
            {/* Control buttons */}
            <View className="mt-4 flex-row items-center space-x-4">
              <PlayButton entry={entry} />
              <ActionButtons entry={entry} />
            </View>
            
            {/* Invest button */}
            <View className="mt-6">
              <Pressable 
                style={{
                  backgroundColor: colors.investButtonBackground,
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => {
                  console.log('Show invest modal')
                }}
              >
                <P style={{ color: colors.investButtonText, fontWeight: '600', textAlign: 'center' }}>Invest</P>
              </Pressable>
            </View>
            
            {/* Theme Switcher */}
            <View className="mt-4">
              <Pressable
                style={{
                  backgroundColor: isDark ? '#333' : '#E0E0E0',
                  borderRadius: 50,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start'
                }}
                onPress={() => useThemeStore.getState().toggleTheme()}
              >
                {isDark ? (
                  <>
                    <Sun width={16} height={16} stroke={colors.text} className="mr-2" />
                    <P style={{ color: colors.text, fontSize: 14 }}>Light Mode</P>
                  </>
                ) : (
                  <>
                    <Moon width={16} height={16} stroke={colors.text} className="mr-2" />
                    <P style={{ color: colors.text, fontSize: 14 }}>Dark Mode</P>
                  </>
                )}
              </Pressable>
            </View>
            
            <ClientLikesList entry={entry} />
          </View>
        </View>
      </View>
      
      {/* Mobile layout */}
      <View className="md:hidden">
        {/* Image */}
        <View className="mb-4 aspect-square w-full">
          <Image
            source={{ uri: imageUrlMedium(entry.imageUrl) }}
            fill={true}
            alt={entry.title}
            style={{ borderRadius: 8 }}
            className="h-full w-full"
            width={400}
            height={400}
          />
        </View>

        {/* Title and Artist info */}
        <BeatSummaryColumn entry={entry} />
        
        {/* Control buttons */}
        <View className="my-4 flex-row items-center space-x-4">
          <PlayButton entry={entry} />
          <ActionButtons entry={entry} />
        </View>
        
        {/* Invest button */}
        <View className="my-4">
          <Pressable 
            style={{
              backgroundColor: colors.investButtonBackground,
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={() => {
              console.log('Show invest modal')
            }}
          >
            <P style={{ color: colors.investButtonText, fontWeight: '600', textAlign: 'center' }}>Invest</P>
          </Pressable>
        </View>
        
        {/* Theme Switcher (mobile) */}
        <View className="mb-4">
          <Pressable
            style={{
              backgroundColor: isDark ? '#333' : '#E0E0E0',
              borderRadius: 50,
              padding: 8,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start'
            }}
            onPress={() => useThemeStore.getState().toggleTheme()}
          >
            {isDark ? (
              <>
                <Sun width={16} height={16} stroke={colors.text} className="mr-2" />
                <P style={{ color: colors.text, fontSize: 14 }}>Light Mode</P>
              </>
            ) : (
              <>
                <Moon width={16} height={16} stroke={colors.text} className="mr-2" />
                <P style={{ color: colors.text, fontSize: 14 }}>Dark Mode</P>
              </>
            )}
          </Pressable>
        </View>
        
        <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
        <ClientLikesList entry={entry} />
      </View>
    </View>
  )
}

export default function BeatScreen({ entry: serverEntry }: Props) {
  const id = useBeatParam()
  assert.ok(id !== undefined)
  const { entry } = useGetEntry({
    id,
    serverEntry,
  })

  if (!entry) {
    // Todo: implement loading skeleton
    return null
  }

  return (
    <View className="flex flex-1">
      <ScrollView className="flex min-h-full items-start w-full max-w-screen-xl mx-auto p-4">
        <Content entry={entry} />
      </ScrollView>
    </View>
  )
}
