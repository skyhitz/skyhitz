'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import ToastComponent from 'app/ui/toast'

type Toast = {
  message: string
  id: number
  options: { type: string; duration?: number }
}

const defaultToastContext = {
  show: (message: Toast['message'], options: Toast['options']) => {},
}

const ToastContext = createContext(defaultToastContext)

// Define a type that works for both browser and Node.js environments
type TimeoutId = ReturnType<typeof setTimeout>;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [timeouts, setTimeouts] = useState<Record<number, TimeoutId>>({})

  const hide = useCallback(
    (id: Toast['id']) => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      )
      if (timeouts[id]) {
        clearTimeout(timeouts[id])
        setTimeouts((currentTimeouts) => {
          const updatedTimeouts = { ...currentTimeouts }
          delete updatedTimeouts[id]
          return updatedTimeouts
        })
      }
    },
    [timeouts],
  )

  const show = useCallback(
    (message: Toast['message'], options: Toast['options']) => {
      const duration = options.duration || 5000
      const id = Date.now()
      setToasts((currentToasts) => [...currentToasts, { message, options, id }])

      if (duration) {
        const timeoutId = setTimeout(() => hide(id), duration)
        setTimeouts((currentTimeouts) => ({
          ...currentTimeouts,
          [id]: timeoutId,
        }))
      }
    },
    [hide],
  )

  return (
    <ToastContext.Provider value={{ show }}>
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          type={toast.options.type}
          message={toast.message}
          onDismiss={() => hide(toast.id)}
        />
      ))}
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
