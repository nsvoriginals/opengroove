"use client"
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Music, Users, ThumbsUp, ThumbsDown, Play, Pause, SkipForward, LogOut, Copy, Check } from 'lucide-react';

interface Song {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  votes: number;
  votedBy: string[];
  addedByUsername: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
  userCount: number;
}

interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
}

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'room'>('home');
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend socket
    socketRef.current = io('http://localhost:4000', {
      transports: ['websocket'],
      withCredentials: true,
    });

    // Listen for events from backend
    socketRef.current.on('room:created', (data:any) => {
      if (data.success) {
        setCurrentRoom(data.room);
        setView('room');
      }
    });

    socketRef.current.on('room:joined', (data:any) => {
      if (data.success) {
        setCurrentRoom(data.room);
        setQueue(data.queue || []);
        setPlaybackState(data.playbackState);
        setView('room');
      }
    });

    socketRef.current.on('queue:updated', (data:any) => {
      setQueue(data.queue);
    });

    socketRef.current.on('playback:state', (data:any) => {
      setPlaybackState(data.playbackState);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleCreateRoom = () => {
    if (!username || !roomName) return;
    socketRef.current?.emit('room:create', { roomName, username });
  };

  const handleJoinRoom = () => {
    if (!username || !roomCode) return;
    socketRef.current?.emit('room:join', { roomCode: roomCode.toUpperCase(), username });
  };

  const handleAddSong = () => {
    if (!youtubeUrl) return;
    socketRef.current?.emit('queue:add', { youtubeUrl });
    setYoutubeUrl('');
  };

  const handleVote = (songId: string, voteType: 'up' | 'down') => {
    socketRef.current?.emit('song:vote', { songId, voteType });
  };

  const handlePlaybackControl = (action: 'play' | 'pause' | 'next') => {
    socketRef.current?.emit('playback:control', { action });
  };

  const handleLeaveRoom = () => {
    socketRef.current?.emit('room:leave');
    setView('home');
    setCurrentRoom(null);
    setQueue([]);
    setPlaybackState(null);
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music size={48} className="text-white" />
            <h1 className="text-6xl font-bold text-white">OpenGroove</h1>
          </div>
          <p className="text-white text-xl mb-12">Listen to music together, synchronized in real-time</p>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room name"
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg mb-4 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={handleCreateRoom}
              disabled={!username || !roomName}
              className="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
            >
              Create Room
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit room code"
              maxLength={6}
              className="w-full p-4 border-2 border-gray-300 rounded-lg text-lg mb-4 focus:border-pink-500 focus:outline-none"
            />
            <button
              onClick={handleJoinRoom}
              disabled={!username || !roomCode || roomCode.length !== 6}
              className="w-full bg-pink-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-pink-700 disabled:bg-gray-300 transition"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }}


  export default App;