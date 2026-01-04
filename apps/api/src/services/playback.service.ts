import { rClient } from '../config/redis.config.js';
import {
  PlaybackState,
  Song,
  REDIS_KEYS,
  ROOM_TTL,
} from '@opengroove/common';

export async function getPlaybackState(
  roomId: string
): Promise<PlaybackState | null> {
  const data = await rClient.get(REDIS_KEYS.ROOM_PLAYBACK(roomId));
  if (!data) return null;
  return JSON.parse(data) as PlaybackState;
}

export async function play(
  roomId: string,
  song: Song,
  startFrom: number = 0
): Promise<PlaybackState> {
  const playbackState: PlaybackState = {
    currentSong: song,
    isPlaying: true,
    currentTime: startFrom,
    startedAt: Date.now() - startFrom * 1000,
    isPaused: false,
  };

  await rClient.setEx(
    REDIS_KEYS.ROOM_PLAYBACK(roomId),
    ROOM_TTL,
    JSON.stringify(playbackState)
  );

  return playbackState;
}

export async function pause(
  roomId: string
): Promise<PlaybackState | null> {
  const state = await getPlaybackState(roomId);
  if (!state) return null;

  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);

  state.isPlaying = false;
  state.isPaused = true;
  state.currentTime = elapsed;

  await rClient.setEx(
    REDIS_KEYS.ROOM_PLAYBACK(roomId),
    ROOM_TTL,
    JSON.stringify(state)
  );

  return state;
}

export async function resume(
  roomId: string
): Promise<PlaybackState | null> {
  const state = await getPlaybackState(roomId);
  if (!state || !state.isPaused) return null;

  state.isPlaying = true;
  state.isPaused = false;
  state.startedAt = Date.now() - state.currentTime * 1000;

  await rClient.setEx(
    REDIS_KEYS.ROOM_PLAYBACK(roomId),
    ROOM_TTL,
    JSON.stringify(state)
  );

  return state;
}

export async function seek(
  roomId: string,
  seekTo: number
): Promise<PlaybackState | null> {
  const state = await getPlaybackState(roomId);
  if (!state) return null;

  state.currentTime = seekTo;
  state.startedAt = Date.now() - seekTo * 1000;

  await rClient.setEx(
    REDIS_KEYS.ROOM_PLAYBACK(roomId),
    ROOM_TTL,
    JSON.stringify(state)
  );

  return state;
}

export async function stop(roomId: string): Promise<void> {
  await rClient.del(REDIS_KEYS.ROOM_PLAYBACK(roomId));
}

export function calculateCurrentTime(state: PlaybackState): number {
  if (!state.isPlaying || state.isPaused) {
    return state.currentTime;
  }

  return Math.floor((Date.now() - state.startedAt) / 1000);
}
