// Shim for react-native-reanimated in web context with React 19 compatibility
import { Animated } from 'react-native-web';
import React from 'react';

// Create basic implementations of commonly used Reanimated APIs
export const useAnimatedStyle = (styleCallback) => {
  // Instead of calling the callback directly, just return an empty style object
  // This avoids errors from trying to access properties that don't exist in our shim
  return {};
};

export const withTiming = (toValue, config, callback) => {
  return toValue;
};

export const withSpring = (toValue, config, callback) => {
  return toValue;
};

export const useSharedValue = (initialValue) => {
  return { value: initialValue };
};

export const runOnJS = (fn) => fn;

export const useAnimatedGestureHandler = (handlers) => {
  return handlers;
};

// Add interpolate function
export const interpolate = (value, inputRange, outputRange, options) => {
  // Simple implementation for web
  const { inputMin, inputMax, outputMin, outputMax } = {
    inputMin: inputRange[0],
    inputMax: inputRange[inputRange.length - 1],
    outputMin: outputRange[0],
    outputMax: outputRange[outputRange.length - 1],
  };
  
  // Basic linear interpolation
  return outputMin + ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin);
};

// Add Extrapolation constants
export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

// Add ReduceMotion enum
export const ReduceMotion = {
  NEVER: 0,
  ALWAYS: 1,
  SYSTEM: 2,
};

// Add other missing functions
export const useAnimatedReaction = (prepare, react) => {
  // Simple no-op implementation for web
};

export const useAnimatedScrollHandler = (handlers) => {
  return () => {};
};

export const useDerivedValue = (deriveValue) => {
  return { value: deriveValue() };
};

export const withDecay = (value, config) => {
  return value;
};

export const withDelay = (delay, animation) => {
  return animation;
};

export const withRepeat = (animation, numberOfReps, reverse, callback) => {
  return animation;
};

export const withSequence = (...animations) => {
  return animations[animations.length - 1];
};

// Export as close to the original API as possible
export default {
  ...Animated,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
  runOnJS,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useDerivedValue,
  withDecay,
  withDelay,
  withRepeat,
  withSequence,
};

// Re-export common constants and types from Animated
export const {
  createAnimatedComponent,
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
} = Animated;
