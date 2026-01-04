// Room types
export interface Room {
  id: string;
  name: string;
  code: string; 
  createdAt: number;
  userCount: number;
}

// User types
export interface User {
  id: string;
  username: string;
  roomId: string | null;
  joinedAt: number;
}

// Song types
export interface Song {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  duration: number;
  addedBy: string; 
  addedByUsername: string;
  votes: number;
  votedBy: string[];
  addedAt: number;
}

// Playback state
export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  startedAt: number;
  isPaused: boolean;
}

// Queue
export interface Queue {
  songs: Song[];
  currentIndex: number;
}

// Socket event payloads
export interface CreateRoomPayload {
  roomName: string;
  username: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  username: string;
}

export interface AddSongPayload {
  youtubeUrl: string;
}

export interface VotePayload {
  songId: string;
  voteType: 'up' | 'down';
}

export interface PlaybackControlPayload {
  action: 'play' | 'pause' | 'seek' | 'next';
  timestamp?: number;
}

// Response types
export interface RoomResponse {
  success: boolean;
  room?: Room;
  error?: string;
}

export interface QueueResponse {
  success: boolean;
  queue?: Song[];
  error?: string;
}