import { cssInterop } from 'nativewind'
import { Video as VideoNative, ResizeMode as ResizeModeNative } from 'expo-av'

cssInterop(VideoNative, {
  className: 'style',
  videoClassName: 'videoStyle',
})

export const Video = VideoNative

export const ResizeMode = ResizeModeNative
