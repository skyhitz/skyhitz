/**
 * Type declarations to fix React 19 + React Native component conflicts
 */
import * as React from 'react';

declare module 'react-native' {
  // Re-export React Native components with compatible types
  export class Text extends React.Component<TextProps> {}
  export interface TextProps extends React.PropsWithChildren<any> {}

  export const Pressable: React.ForwardRefExoticComponent<
    PressableProps & React.RefAttributes<any>
  >;
  export interface PressableProps extends React.PropsWithChildren<any> {
    onPress?: () => void;
    style?: any;
    className?: string;
    [key: string]: any;
  }

  export class View extends React.Component<ViewProps> {}
  export interface ViewProps extends React.PropsWithChildren<any> {
    style?: any;
    className?: string;
    [key: string]: any;
  }

  // Add other React Native components as needed
  export class Image extends React.Component<ImageProps> {}
  export interface ImageProps {
    source: any;
    style?: any;
    className?: string;
    [key: string]: any;
  }

  export class ScrollView extends React.Component<ScrollViewProps> {}
  export interface ScrollViewProps extends React.PropsWithChildren<any> {
    style?: any;
    contentContainerStyle?: any;
    className?: string;
    [key: string]: any;
  }

  export const SafeAreaView: React.ComponentType<ViewProps>;
}
