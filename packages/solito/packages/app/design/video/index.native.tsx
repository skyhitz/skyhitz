'use client'
import * as React from 'react'

// Define our own ResizeMode for consistent API between native and web
export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch'
}

// For native, create a stub component with forwardRef for consistency with web
export const Video = React.forwardRef(({ 
  source, 
  style, 
  resizeMode, 
  onPlaybackStatusUpdate, 
  videoClassName, 
  videoStyle, 
  className,  
  onError,
  ...props 
}: any, ref: any) => {
  // We will use a stub implementation that works on both platforms
  // In the actual native environment, the .native.tsx file will be picked up
  // This is just to make TypeScript happy
  
  // Handle ref so both implementations work the same way
  React.useImperativeHandle(ref, () => ({
    playAsync: () => Promise.resolve({ isPlaying: true }),
    pauseAsync: () => Promise.resolve({ isPlaying: false }),
    setStatusAsync: () => Promise.resolve({}),
    getStatusAsync: () => Promise.resolve({ isLoaded: true, isPlaying: false }),
  }));
  
  return <React.Fragment {...props}/>
});

Video.displayName = 'Video';

// Re-export for compatibility with existing code
export const VideoPlayer = Video

export default Video
