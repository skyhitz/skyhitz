'use client'
import * as React from 'react'
import { Platform } from 'react-native'
import { X } from 'app/ui/icons/x'
import { Dialog, Sheet, YStack, Button, Adapt } from 'tamagui'

type ModalProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ visible, onClose, children }: ModalProps) {
  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      {/* For mobile, use Sheet */}
      <Adapt when="sm" platform="touch">
        <Sheet
          modal
          dismissOnSnapToBottom
          onOpenChange={(open) => {
            if (!open) onClose()
          }}
        >
          <Sheet.Frame padding="$4" backgroundColor="$background">
            <Sheet.Handle />
            <Button
              position="absolute"
              top="$2"
              right="$2"
              size="$3"
              circular
              icon={<X width={20} height={20} />}
              onPress={onClose}
              backgroundColor="$gray8"
            />
            {children}
          </Sheet.Frame>
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      {/* For desktop, use Dialog */}
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          maxWidth={500}
        >
          <Dialog.Close asChild>
            <Button
              position="absolute"
              top="$2"
              right="$2"
              size="$3"
              circular
              icon={<X width={20} height={20} />}
              backgroundColor="$gray8"
            />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
