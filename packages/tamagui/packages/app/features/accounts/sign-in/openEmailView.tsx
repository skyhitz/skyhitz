'use client'
import { YStack } from 'tamagui'
import { openEmail } from 'app/utils/email'
import { P } from 'app/design/typography'
import { Button } from 'app/design/button'

export function OpenEmailView() {
  return (
    <YStack alignItems="center">
      <P 
        height={48} 
        width="100%" 
        flexDirection="row" 
        alignItems="center" 
        borderRadius="$3" 
        backgroundColor="$gray7" 
        opacity={0.2}
        padding="$2" 
        fontSize="$3" 
        color="$white1"
      >
        We sent you an email to access your account!
      </P>
      <Button
        text="Open Email"
        onPress={() => openEmail()}
        marginTop="$4"
      />
    </YStack>
  )
}
