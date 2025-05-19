'use client'

/**
 * This file provides properly typed React Native components for use with React 19
 * It wraps the original components to avoid type conflicts between different React type definitions
 */
import * as React from 'react'
import {
  Text as RNText,
  Pressable as RNPressable,
  View as RNView,
  TextProps,
  ViewProps,
  PressableProps,
} from 'react-native'

// Typed wrappers for React Native components
export const Text: React.FC<TextProps> = (props) => <RNText {...props} />
export const Pressable: React.FC<PressableProps> = (props) => <RNPressable {...props} />
export const View: React.FC<ViewProps> = (props) => <RNView {...props} />

// Re-export other components as needed
export * from 'react-native'
