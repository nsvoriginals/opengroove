"use client"

import React, { useState, useEffect } from 'react';
import { Music, Users, Plus, X, ThumbsUp, ThumbsDown, Play, Pause, SkipForward, Clock, Wifi, WifiOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

// Types based on your backend
interface Room {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  userCount: number;
}

interface User {
  id: string;
  username: string;
  roomId: string;
  joinedAt: number;
}

interface Song {
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

interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  startedAt: number;
  isPaused: boolean;
}

interface WelcomeScreenProps {
  onCreateRoom: (roomName: string, username: string) => void;
  onJoinRoom: (roomCode: string, username: string) => void;
  error: string;
  connected: boolean;
}

interface RoomScreenProps {
  room: Room | null;
  user: User | null;
  users: User[];
  queue: Song[];
  playbackState: PlaybackState | null;
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  onAddSong: () => void;
  onRemoveSong: (songId: string) => void;
  onVoteSong: (songId: string, voteType: 'up' | 'down') => void;
  onPlaybackControl: (action: 'play' | 'pause' | 'next' | 'seek', timestamp?: number) => void;
  onLeaveRoom: () => void;
  connected: boolean;
}

const SOCKET_EVENTS = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_CREATED: 'room_created',
  ROOM_JOINED: 'room_joined',
  ROOM_UPDATED: 'room_updated',
  ROOM_ERROR: 'room_error',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  ADD_SONG: 'add_song',
  REMOVE_SONG: 'remove_song',
  QUEUE_UPDATED: 'queue_updated',
  VOTE_SONG: 'vote_song',
  SONG_VOTED: 'song_voted',
  PLAYBACK_CONTROL: 'playback_control',
  PLAYBACK_STATE: 'playback_state',
  PLAYBACK_SYNC: 'playback_sync',
  SONG_ENDED: 'song_ended',
} as const;

export default function OpenGrooveApp() {
  const [screen, setScreen] = useState<'welcome' | 'room'>('welcome');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [queue, setQueue] = useState<Song[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const newSocket = io('http://localhost:4000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('✅ Connected to server, socket id:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('❌ Disconnected from server');
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      setError('Failed to connect to server. Is the backend running?');
      setConnected(false);
    });

    newSocket.on(SOCKET_EVENTS.ROOM_CREATED, (data: { room: Room; user: User }) => {
      console.log('✅ Room created:', data);
      setRoom(data.room);
      setUser(data.user);
      setScreen('room');
      setError('');
    });

    newSocket.on(SOCKET_EVENTS.ROOM_JOINED, (data: { 
      room: Room; 
      user: User; 
      users: User[]; 
      queue: Song[]; 
      playbackState: PlaybackState | null 
    }) => {
      console.log('✅ Room joined:', data);
      setRoom(data.room);
      setUser(data.user);
      setUsers(data.users);
      setQueue(data.queue || []);
      setPlaybackState(data.playbackState);
      setScreen('room');
      setError('');
    });

    newSocket.on(SOCKET_EVENTS.ROOM_ERROR, (data: { error: string }) => {
      console.error('❌ Room error:', data.error);
      setError(data.error);
    });

    newSocket.on(SOCKET_EVENTS.ROOM_UPDATED, (data: { room: Room }) => {
      setRoom(data.room);
    });

    newSocket.on(SOCKET_EVENTS.USER_JOINED, (data: { user: User }) => {
      setUsers(prev => [...prev, data.user]);
    });

    newSocket.on(SOCKET_EVENTS.USER_LEFT, (data: { userId: string }) => {
      setUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    newSocket.on(SOCKET_EVENTS.QUEUE_UPDATED, (data: { queue: Song[] }) => {
      setQueue(data.queue);
    });

    newSocket.on(SOCKET_EVENTS.PLAYBACK_STATE, (data: { playbackState: PlaybackState | null; queue: Song[] }) => {
      setPlaybackState(data.playbackState);
      setQueue(data.queue);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = (roomName: string, username: string) => {
    console.log('🎵 Creating room:', { roomName, username, connected, hasSocket: !!socket });
    if (!socket) {
      setError('Not connected to server');
      return;
    }
    if (!connected) {
      setError('Waiting for connection...');
      return;
    }
    if (socket && roomName && username) {
      console.log('📤 Emitting CREATE_ROOM event');
      socket.emit(SOCKET_EVENTS.CREATE_ROOM, { roomName, username });
    }
  };

  const joinRoom = (roomCode: string, username: string) => {
    if (socket && roomCode && username) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: roomCode.toUpperCase(), username });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM);
      setScreen('welcome');
      setRoom(null);
      setUser(null);
      setUsers([]);
      setQueue([]);
      setPlaybackState(null);
    }
  };

  const addSong = () => {
    if (socket && youtubeUrl) {
      socket.emit(SOCKET_EVENTS.ADD_SONG, { youtubeUrl });
      setYoutubeUrl('');
    }
  };

  const removeSong = (songId: string) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.REMOVE_SONG, { songId });
    }
  };

  const voteSong = (songId: string, voteType: 'up' | 'down') => {
    if (socket && user) {
      const song = queue.find(s => s.id === songId);
      if (song && !song.votedBy.includes(user.id)) {
        socket.emit(SOCKET_EVENTS.VOTE_SONG, { songId, voteType });
      }
    }
  };

  const playbackControl = (action: 'play' | 'pause' | 'next' | 'seek', timestamp?: number) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.PLAYBACK_CONTROL, { action, timestamp });
    }
  };

  if (screen === 'welcome') {
    return <WelcomeScreen 
      onCreateRoom={createRoom} 
      onJoinRoom={joinRoom} 
      error={error}
      connected={connected}
    />;
  }

  return (
    <RoomScreen
      room={room}
      user={user}
      users={users}
      queue={queue}
      playbackState={playbackState}
      youtubeUrl={youtubeUrl}
      setYoutubeUrl={setYoutubeUrl}
      onAddSong={addSong}
      onRemoveSong={removeSong}
      onVoteSong={voteSong}
      onPlaybackControl={playbackControl}
      onLeaveRoom={leaveRoom}
      connected={connected}
    />
  );
}

function WelcomeScreen({ onCreateRoom, onJoinRoom, error, connected }: WelcomeScreenProps) {
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = () => {
    if (mode === 'create' && roomName && username) {
      onCreateRoom(roomName, username);
    } else if (mode === 'join' && roomCode && username) {
      onJoinRoom(roomCode, username);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full mb-4">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">OpenGroove</h1>
            <p className="text-gray-600">Listen together, vote together</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Disconnected</span>
              </>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              Create a Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-gray-800 text-white py-4 rounded-xl font-semibold hover:bg-gray-700 transition-all"
            >
              Join a Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={() => setMode(null)}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </h2>

        <div className="space-y-4">
          {mode === 'create' ? (
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900"
            />
          ) : (
            <input
              type="text"
              placeholder="Room Code (e.g., ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none uppercase text-gray-900"
              maxLength={6}
            />
          )}

          <input
            type="text"
            placeholder="Your Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-gray-900"
          />

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomScreen({ 
  room, 
  user, 
  users, 
  queue, 
  playbackState, 
  youtubeUrl, 
  setYoutubeUrl,
  onAddSong, 
  onRemoveSong, 
  onVoteSong, 
  onPlaybackControl, 
  onLeaveRoom,
  connected 
}: RoomScreenProps) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (playbackState?.isPlaying && !playbackState.isPaused) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - playbackState.startedAt) / 1000);
        setCurrentTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else if (playbackState) {
      setCurrentTime(playbackState.currentTime);
    }
  }, [playbackState]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddSongKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAddSong();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-500" />
              <h1 className="text-xl font-bold">{room?.name}</h1>
            </div>
            <div className="bg-purple-600 px-3 py-1 rounded-lg text-sm font-mono">
              {room?.code}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{users.length} online</span>
            </div>
            {connected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <button
              onClick={onLeaveRoom}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Now Playing</h2>
              {playbackState?.currentSong ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                    <img
                      src={playbackState.currentSong.thumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{playbackState.currentSong.title || 'Loading...'}</h3>
                    <p className="text-sm text-gray-400">Added by {playbackState.currentSong.addedByUsername}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => onPlaybackControl(playbackState.isPlaying ? 'pause' : 'play')}
                      className="p-3 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
                    >
                      {playbackState.isPlaying && !playbackState.isPaused ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      onClick={() => onPlaybackControl('next')}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <SkipForward className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No song playing</p>
                  <p className="text-sm mt-2">Add a song to start the party!</p>
                </div>
              )}
            </div>

            {/* Add Song */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Add a Song</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube URL"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyPress={handleAddSongKeyPress}
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={onAddSong}
                  className="px-6 bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>

            {/* Queue */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Queue ({queue.length})</h2>
              {queue.length > 0 ? (
                <div className="space-y-3">
                  {queue.map((song, index) => (
                    <div
                      key={song.id}
                      className="bg-gray-900 rounded-xl p-4 flex items-center gap-4"
                    >
                      <span className="text-2xl font-bold text-gray-600 w-8">
                        {index + 1}
                      </span>
                      <img
                        src={song.thumbnail}
                        alt="Thumbnail"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{song.title || 'Loading...'}</h3>
                        <p className="text-sm text-gray-400">by {song.addedByUsername}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onVoteSong(song.id, 'up')}
                          disabled={song.votedBy.includes(user?.id || '')}
                          className="p-2 bg-gray-800 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-bold w-8 text-center">{song.votes}</span>
                        <button
                          onClick={() => onVoteSong(song.id, 'down')}
                          disabled={song.votedBy.includes(user?.id || '')}
                          className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        {song.addedBy === user?.id && (
                          <button
                            onClick={() => onRemoveSong(song.id)}
                            className="p-2 bg-gray-800 hover:bg-red-600 rounded-lg transition-colors ml-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>Queue is empty</p>
                  <p className="text-sm mt-2">Be the first to add a song!</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Users */}
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center font-bold">
                     {u?.username?.charAt(0)?.toUpperCase() ?? ""}

                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{u.username}</p>
                      {u.id === user?.id && (
                        <p className="text-xs text-purple-400">You</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}