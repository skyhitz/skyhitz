// Shim for expo-av in web context
import React from 'react';
import { View } from 'react-native-web';

// Define ResizeMode constants similar to expo-av
const ResizeMode = {
  CONTAIN: 'contain',
  COVER: 'cover',
  STRETCH: 'stretch',
};

// Define Playback class that mirrors the expo-av API
class Playback {
  constructor(nativeRef) {
    this._nativeRef = nativeRef;
    this._status = {
      isLoaded: true,
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 0,
      isBuffering: false,
      didJustFinish: false,
      rate: 1.0,
      volume: 1.0,
      isLooping: false,
    };
  }

  async playAsync() {
    if (this._nativeRef) {
      try {
        await this._nativeRef.play();
        this._status.isPlaying = true;
      } catch (error) {
        console.error('Error playing:', error);
      }
    }
    return this.getStatus();
  }

  async pauseAsync() {
    if (this._nativeRef) {
      this._nativeRef.pause();
      this._status.isPlaying = false;
    }
    return this.getStatus();
  }

  async setPositionAsync(positionMillis) {
    if (this._nativeRef) {
      this._nativeRef.currentTime = positionMillis / 1000;
      this._status.positionMillis = positionMillis;
    }
    return this.getStatus();
  }

  async setIsLoopingAsync(isLooping) {
    if (this._nativeRef) {
      this._nativeRef.loop = isLooping;
      this._status.isLooping = isLooping;
    }
    return this.getStatus();
  }

  async setVolumeAsync(volume) {
    if (this._nativeRef) {
      this._nativeRef.volume = volume;
      this._status.volume = volume;
    }
    return this.getStatus();
  }

  async unloadAsync() {
    if (this._nativeRef) {
      this._nativeRef.src = '';
      this._status.isLoaded = false;
    }
    return this.getStatus();
  }

  getStatus() {
    if (this._nativeRef) {
      this._status.positionMillis = this._nativeRef.currentTime * 1000;
      this._status.durationMillis = this._nativeRef.duration * 1000 || 0;
      this._status.isPlaying = !this._nativeRef.paused;
      this._status.isLooping = this._nativeRef.loop;
      this._status.volume = this._nativeRef.volume;
      this._status.didJustFinish = this._nativeRef.ended;
    }
    return { ...this._status };
  }
}

// Simple Video component that mimics the expo-av Video API for web
class Video extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this._playbackInstance = null;
  }

  componentDidMount() {
    if (this.videoRef.current) {
      this._playbackInstance = new Playback(this.videoRef.current);
      if (this.props.onPlaybackStatusUpdate) {
        this.videoRef.current.addEventListener('timeupdate', this._handleStatusUpdate);
        this.videoRef.current.addEventListener('ended', this._handleStatusUpdate);
        this.videoRef.current.addEventListener('play', this._handleStatusUpdate);
        this.videoRef.current.addEventListener('pause', this._handleStatusUpdate);
      }
    }
  }

  componentWillUnmount() {
    if (this.videoRef.current && this.props.onPlaybackStatusUpdate) {
      this.videoRef.current.removeEventListener('timeupdate', this._handleStatusUpdate);
      this.videoRef.current.removeEventListener('ended', this._handleStatusUpdate);
      this.videoRef.current.removeEventListener('play', this._handleStatusUpdate);
      this.videoRef.current.removeEventListener('pause', this._handleStatusUpdate);
    }
  }

  _handleStatusUpdate = () => {
    if (this._playbackInstance && this.props.onPlaybackStatusUpdate) {
      this.props.onPlaybackStatusUpdate(this._playbackInstance.getStatus());
    }
  }

  playAsync = async () => {
    if (this._playbackInstance) {
      return this._playbackInstance.playAsync();
    }
    return { didJustFinish: false, positionMillis: 0 };
  };

  pauseAsync = async () => {
    if (this._playbackInstance) {
      return this._playbackInstance.pauseAsync();
    }
    return { didJustFinish: false, positionMillis: 0 };
  };

  setPositionAsync = async (positionMillis) => {
    if (this._playbackInstance) {
      return this._playbackInstance.setPositionAsync(positionMillis);
    }
    return { didJustFinish: false, positionMillis: 0 };
  };

  setIsLoopingAsync = async (isLooping) => {
    if (this._playbackInstance) {
      return this._playbackInstance.setIsLoopingAsync(isLooping);
    }
    return {};
  };

  render() {
    const { source, style, resizeMode, shouldPlay, isLooping, volume, onPlaybackStatusUpdate, ...rest } = this.props;
    const uri = source?.uri || '';
    
    const objectFit = resizeMode === ResizeMode.CONTAIN 
      ? 'contain' 
      : resizeMode === ResizeMode.COVER 
        ? 'cover' 
        : 'fill';
    
    return (
      <View style={style}>
        <video
          ref={this.videoRef}
          src={uri}
          style={{ width: '100%', height: '100%', objectFit }}
          autoPlay={shouldPlay}
          loop={isLooping}
          volume={volume !== undefined ? volume : 1}
          {...rest}
        />
      </View>
    );
  }
}

// Add InterruptionMode constants
export const InterruptionModeIOS = {
  DO_NOT_MIX: 1,
  DO_NOT_INTERRUPT: 2,
  MIX_WITH_OTHERS: 3,
};

export const InterruptionModeAndroid = {
  DO_NOT_MIX: 1,
  DO_NOT_INTERRUPT: 2,
  MIX_WITH_OTHERS: 3,
};

// Export components and constants
export { Video, ResizeMode, Playback };

// Export any other expo-av APIs needed
export const Audio = {
  Sound: {
    createAsync: async () => ({
      sound: {
        playAsync: async () => ({}),
        pauseAsync: async () => ({}),
        stopAsync: async () => ({}),
        unloadAsync: async () => ({}),
      },
      status: {},
    }),
  },
};

// Add the internal build/AV module structure that the app is importing from
export const AV = {
  Playback,
};

// Export build directory structure
export const build = {
  AV: { Playback }
};
