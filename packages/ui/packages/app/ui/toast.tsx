import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { P } from 'app/design/typography'
import X from 'app/ui/icons/x'
import Check from 'app/ui/icons/check'
import { MotiView } from 'app/design/moti'

const ToastComponent = ({
  message,
  type,
  onDismiss,
}: {
  message: string
  type: string
  onDismiss: () => void
}) => {
  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  const bgColorClass = type === 'success' ? 'bg-green-200' : 'bg-red-400'
  const borderColorClass = type === 'success' ? 'border-green' : 'border-red'
  const iconColorClass = type === 'success' ? 'text-green' : 'text-red'

  return (
    <MotiView
      from={{ translateY: -100, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      exit={{ translateY: -100, opacity: 0 }}
      className={`${borderColorClass} absolute left-4 right-4 top-4 z-10 flex-row items-center justify-between gap-4 rounded-lg border p-4 md:left-auto md:w-auto  ${bgColorClass}`}
    >
      <P className="flex-grow text-sm text-gray-400">{message}</P>
      <Pressable onPress={handleDismiss}>
        {type === 'success' ? (
          <Check className={iconColorClass} />
        ) : (
          <X className={iconColorClass} />
        )}
      </Pressable>
    </MotiView>
  )
}

export default ToastComponent
