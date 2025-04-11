'use client'

import { TextLink } from 'solito/link'
import { MotiLink } from 'solito/moti/app'
import { Text, View } from 'react-native'

export function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-8 p-4">
      <H1>Welcome to Solito.</H1>
      <View className="max-w-[600px] gap-4">
        <Text className="text-center text-blue">
          Here is a basic starter to show you how you can navigate from one
          screen to another. This screen uses the same code on Next.js and React
          Native.
        </Text>
        <Text className="text-center">
          Solito is made by{' '}
          <TextLink
            href="https://twitter.com/fernandotherojo"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500"
          >
            Fernando Rojo
          </TextLink>
          .
        </Text>
      </View>
      <View className="flex-row gap-8">
        <TextLink
          href="/users/fernando"
          className="text-blue-500 font-bold text-2xl"
        >
          Regular Link
        </TextLink>
        <MotiLink
          href="/users/fernando"
          from={{
            scale: 0,
            rotateZ: '0deg',
          }}
          animate={({ hovered, pressed }) => {
            'worklet'

            return {
              scale: pressed ? 0.95 : hovered ? 1.1 : 1,
              rotateZ: pressed ? '0deg' : hovered ? '-3deg' : '0deg',
            }
          }}
          transition={{
            type: 'timing',
            duration: 150,
          }}
        >
          <Text selectable={false} className="text-black font-bold text-2xl">
            Moti Link
          </Text>
        </MotiLink>
      </View>
    </View>
  )
}

const H1 = ({ children }: { children: React.ReactNode }) => {
  return <Text className="text-black text-6xl font-raleway">{children}</Text>
}
