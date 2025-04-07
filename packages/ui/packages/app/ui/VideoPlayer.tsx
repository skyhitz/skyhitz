import { useMemo } from 'react'
import { Platform, View } from 'react-native'
import { useRecoilValue } from 'recoil'
import { usePlayback } from 'app/hooks/usePlayback'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { Video, ResizeMode } from 'app/design/video'
import { entryAtom, playbackUriAtom } from 'app/state/player'

function Poster() {
  const entry = useRecoilValue(entryAtom)

  const posterUri = useMemo(() => {
    if (entry?.imageUrl) {
      return imageUrlMedium(entry.imageUrl)
    }
    return undefined
  }, [entry])

  return (
    posterUri && (
      <View className="absolute aspect-square max-h-[50vh] w-screen items-center justify-center  md:max-w-[3.5rem] md:rounded-md">
        <SolitoImage
          fill
          src={posterUri}
          // @ts-ignore
          className={'aspect-square md:rounded-md'}
          alt="player"
          contentFit="cover"
          sizes="(max-width: 768px) 100vw"
        />
      </View>
    )
  )
}

export function VideoPlayer() {
  const { onPlaybackStatusUpdate, onError, setPlayback, playbackUri } =
    usePlayback()

  return (
    <View className="items-center justify-center">
      <Poster />

      <Video
        source={
          Platform.OS === 'web' && playbackUri
            ? { uri: playbackUri }
            : undefined
        }
        ref={(ref) => {
          setPlayback(ref)
        }}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        resizeMode={ResizeMode.COVER}
        // @ts-ignore
        videoClassName={`h-full w-full max-h-[50vh] md:max-w-[3.5rem]`}
        videoStyle={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
        }}
        className={`aspect-square max-h-[50vh] w-screen items-center justify-center  md:max-w-[3.5rem] md:rounded-md`}
        onError={onError}
      />
    </View>
  )
}
