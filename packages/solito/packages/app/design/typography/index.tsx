'use client'
import * as React from 'react'
import { Text as RNText, TextProps, ActivityIndicator as RNActivityIndicator, ActivityIndicatorProps } from 'react-native'

// Basic text component with default styling
export function Text({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-base ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Paragraph component
export function P({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-base leading-relaxed ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Heading 1 component
export function H1({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-3xl font-bold ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Heading 2 component
export function H2({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-2xl font-bold ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Heading 3 component
export function H3({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-xl font-bold ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Heading 4 component
export function H4({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-lg font-bold ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Activity indicator with theming
export function ActivityIndicator({ 
  size = 'small',
  color = '#ffffff',
  ...props
}: ActivityIndicatorProps) {
  return <RNActivityIndicator size={size} color={color} {...props} />
}

// Small Text component
export function Small({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-sm ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Label component
export function Label({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-sm font-medium ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Caption component
export function Caption({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-xs text-gray-500 ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}

// Button text component
export function Button({ className, ...props }: TextProps & { className?: string }) {
  return (
    <RNText className={`text-base font-semibold ${className || ''}`} {...props}>
      {props.children}
    </RNText>
  )
}
