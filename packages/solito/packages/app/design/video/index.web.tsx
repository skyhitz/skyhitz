'use client'
import * as React from 'react'
import { View, Text } from 'react-native'

// Define the resize modes that match the expected API
export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch'
}

// Use forwardRef to handle the ref from the parent component
export const Video = React.forwardRef(({
  source, 
  style, 
  resizeMode = ResizeMode.COVER, 
  onPlaybackStatusUpdate, 
  videoClassName, 
  videoStyle,
  className, 
  onError,
  ...props 
}: any, ref: any) => {

  // Send a single mock status update on mount only
  // We use an empty dependency array to ensure this only runs once
  React.useEffect(() => {
    // Only send a mock update if the callback is provided
    if (onPlaybackStatusUpdate) {
      // Use a timeout to simulate an async nature of video loading
      const timeoutId = setTimeout(() => {
        const mockStatus = {
          isLoaded: true,
          isPlaying: false,
          positionMillis: 0,
          durationMillis: 60000, // 1 minute mock duration
          uri: source?.uri || '',
        };
        onPlaybackStatusUpdate(mockStatus);
      }, 100);
      
      // Clean up timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Handle ref
  React.useImperativeHandle(ref, () => ({
    // Stub methods that would normally be on the player
    playAsync: () => Promise.resolve({ isPlaying: true }),
    pauseAsync: () => Promise.resolve({ isPlaying: false }),
    setStatusAsync: () => Promise.resolve({}),
    getStatusAsync: () => Promise.resolve({ isLoaded: true, isPlaying: false }),
  }));

  return (
    <View style={[{ backgroundColor: '#000', aspectRatio: 16/9 }, style]} className={className}>
      {/* For web, we're providing a placeholder since expo-video isn't available */}
      <Text style={{ color: '#fff', padding: 10, textAlign: 'center' }}>
        Video Preview
      </Text>
    </View>
  );
});

Video.displayName = 'Video';

// Export for compatibility with older code
export { Video as VideoPlayer }

export default Video
