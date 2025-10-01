import { Entry } from 'app/api/graphql/types';
interface PlayerAdapter {
    play(): void | Promise<void>;
    pause(): void | Promise<void>;
    seekTo(seconds: number): void | Promise<void>;
    setVolume(volume: number): void | Promise<void>;
    buffered?: any;
    getDuration(): number;
    getCurrentTime(): number;
    isPlaying(): boolean;
}
export declare enum PlaybackState {
    IDLE = "IDLE",// Initial state, nothing loaded
    LOADING = "LOADING",// Loading media
    PLAYING = "PLAYING",// Currently playing
    PAUSED = "PAUSED",// Paused but loaded
    SEEKING = "SEEKING",// User is seeking
    ERROR = "ERROR",// Error occurred
    ENDED = "ENDED",// Playback ended
    FALLBACK = "FALLBACK"
}
export interface PlayerState {
    entry: Entry | null;
    playbackUri: string;
    playbackState: PlaybackState;
    duration: number;
    position: number;
    loadedSeconds: number;
    volume: number;
    playbackRate: number;
    loop: boolean;
    muted: boolean;
    loaded: number;
    positionProgress: number;
    playingHistory: Entry[];
    playlist: Entry[];
    playerRef: any | null;
    playerAdapter: PlayerAdapter | null;
    shouldPlay: boolean;
    shuffle: boolean;
    isReady: boolean;
    setEntry: (entry: Entry | null) => void;
    setPlaybackUri: (uri: string) => void;
    setPlayerRef: (player: any) => void;
    setPlaylist: (playlist: Entry[]) => void;
    setPlayingHistory: (history: Entry[]) => void;
    play: (uri?: string) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    stop: () => Promise<void>;
    seekTo: (fraction: number) => Promise<void>;
    setVolume: (volume: number) => void;
    setPlaybackRate: (rate: number) => void;
    toggleMute: () => void;
    toggleLoop: () => void;
    setProgress: () => void;
    setPlaybackState: (state: PlaybackState) => void;
    setPosition: () => void;
    setPositionProgress: (positionProgress: number) => void;
    setError: (error: string | null) => void;
    setDuration: () => void;
    setSeeking: () => void;
    setIsReady: (isReady: boolean) => void;
    reset: () => void;
}
export declare const usePlayerStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PlayerState>>;
export {};
//# sourceMappingURL=player.d.ts.map