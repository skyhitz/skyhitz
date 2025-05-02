'use client'
import * as React from 'react'
import {
  View,
  Modal as RNModal,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native'
import { X } from 'app/ui/icons/x'

type ModalProps = {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ visible, onClose, children }: ModalProps) {
  // Create a ref to help with modal animation and transitions
  const [isVisible, setIsVisible] = React.useState(visible)

  React.useEffect(() => {
    if (visible) {
      setIsVisible(true)
    } else {
      // Add a small delay before fully hiding to allow animations
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!isVisible && !visible) {
    return null
  }

  // Web-specific modal rendering
  if (Platform.OS === 'web') {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="relative z-10 max-w-lg rounded-xl">
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white"
          >
            <X className="h-5 w-5 stroke-current text-white" />
          </button>
          {children}
        </div>
      </div>
    )
  }

  // React Native modal rendering
  return (
    <RNModal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalOverlay} />
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X width={20} height={20} color="white" />
          </TouchableOpacity>
          {children}
        </View>
      </View>
    </RNModal>
  )
}

// Styles for React Native
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'black',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: 350,
  },
  closeButton: {
    position: 'absolute',
    top: -15,
    right: -15,
    backgroundColor: '#333',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
})
