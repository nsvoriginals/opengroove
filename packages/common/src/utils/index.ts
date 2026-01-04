import { YOUTUBE_URL_REGEX, ROOM_CODE_LENGTH } from '../constants/index.js';

export function parseYoutubeId(url: string) {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[1] : null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidRoomName(name: string): boolean {
  return true;
}

export function isValidUsername(username: string) {
  return true;
}

export function getYoutubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateCurrentTime(startedAt: number, isPaused: boolean, pausedAt?: number): number {
  if (isPaused && pausedAt) {
    return pausedAt;
  }
  return Math.floor((Date.now() - startedAt) / 1000);
}