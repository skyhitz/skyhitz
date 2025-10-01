'use client'
import { YStack, XStack, Text, H1, H2 } from 'tamagui'
import { Button } from 'app/design/button'
import { P, H3, ActivityIndicator } from 'app/design/typography'
import { useState } from 'react'

export default function TestPage() {
  const [loading, setLoading] = useState(false)

  const handlePress = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <YStack flex={1} padding="$6" gap="$6" backgroundColor="$background">
      <H1>Component Test Page</H1>
      
      {/* Typography Section */}
      <YStack gap="$3" padding="$4" backgroundColor="$color2" borderRadius="$4">
        <H2>Typography Components</H2>
        <P>This is a paragraph using the P component with default styling.</P>
        <H3>This is an H3 heading</H3>
        <Text fontSize="$3" color="$color11">Regular Tamagui Text component</Text>
      </YStack>

      {/* Button Section */}
      <YStack gap="$3" padding="$4" backgroundColor="$color2" borderRadius="$4">
        <H2>Button Components</H2>
        
        <XStack gap="$3" flexWrap="wrap">
          <Button 
            text="Primary" 
            onPress={handlePress}
            variant="primary"
          />
          <Button 
            text="Secondary" 
            onPress={handlePress}
            variant="secondary"
          />
          <Button 
            text="White" 
            onPress={handlePress}
            variant="white"
          />
        </XStack>

        <XStack gap="$3" flexWrap="wrap">
          <Button 
            text="Small" 
            onPress={handlePress}
            size="small"
          />
          <Button 
            text="Default" 
            onPress={handlePress}
            size="default"
          />
          <Button 
            text="Large" 
            onPress={handlePress}
            size="large"
          />
        </XStack>

        <XStack gap="$3" flexWrap="wrap">
          <Button 
            text={loading ? "Loading..." : "Loading Test"}
            onPress={handlePress}
            loading={loading}
          />
          <Button 
            text="Disabled" 
            onPress={() => {}}
            disabled={true}
          />
        </XStack>
      </YStack>

      {/* Activity Indicator Section */}
      <YStack gap="$3" padding="$4" backgroundColor="$color2" borderRadius="$4">
        <H2>Activity Indicators</H2>
        <XStack gap="$4" ai="center">
          <ActivityIndicator size="small" />
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </XStack>
      </YStack>

      {/* Success Message */}
      <YStack padding="$4" backgroundColor="$green9" borderRadius="$4">
        <Text color="$white1" fontSize="$5" fontWeight="bold" textAlign="center">
          ✅ All Components Working!
        </Text>
      </YStack>
    </YStack>
  )
}

