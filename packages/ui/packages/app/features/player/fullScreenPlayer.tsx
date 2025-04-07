import { Pressable, SafeAreaView, Text, View } from 'react-native'
import ChevronDown from 'app/ui/icons/chevron-down'
import { PlayerButtonsRow } from './components/playerButtonsRow'
import { PlayerSlider } from './components/playerSlider'
import { VideoPlayer } from 'app/ui/VideoPlayer'
import { MotiView } from 'app/design/moti'
import { entryAtom } from 'app/state/player'
import { useRecoilValue } from 'recoil'

type Props = {
  onTogglePress: () => void
  animatedStyle: any
}

function EntryInfo() {
  const entry = useRecoilValue(entryAtom)

  return (
    <>
      <View className="flex-1 items-center justify-center md:max-w-[200px] md:items-start md:px-4">
        <Text
          className="text-center text-sm font-bold text-gray-600"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {entry?.title}
        </Text>
        <Text
          className="text-center text-base text-gray-600 md:text-xs"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {entry?.artist}
        </Text>
      </View>
    </>
  )
}

export function FullScreenPlayer({ onTogglePress, animatedStyle }: Props) {
  return (
    <MotiView
      style={[animatedStyle]}
      className="absolute z-[1] w-full opacity-0 md:z-10 md:flex md:py-2 md:!opacity-100"
    >
      <SafeAreaView className="flex h-full items-center bg-white px-4">
        <View className="flex w-full flex-row items-center justify-between py-3 md:hidden">
          <Pressable className="" onPress={onTogglePress} hitSlop={10}>
            <ChevronDown className="text-gray-600" size={24} />
          </Pressable>
        </View>
        <View className="w-full items-center justify-between gap-y-8 md:flex-row">
          <VideoPlayer />

          <PlayerSlider className="md:hidden" />
          <EntryInfo />
          <PlayerButtonsRow size="large" className="md:hidden" />
          <View className="hidden grow items-center justify-evenly pb-1 md:flex">
            <PlayerButtonsRow />
            <PlayerSlider />
          </View>
          <View className="hidden h-full w-64 lg:flex" />
          {/* {entry && (
                <LikesList
                  entry={entry}
                  showLikeButton
                  useAndroidHorizontalList={Platform.OS === 'android'}
                  classname="md:hidden"
                />
              )} */}
        </View>
      </SafeAreaView>
    </MotiView>
  )
}
