import { rClient } from '../config/redis.config.js';
import {
  Song,
  REDIS_KEYS,
  ROOM_TTL,
  generateId,
  parseYoutubeId,
  getYoutubeThumbnail,
  isValidYoutubeUrl,
} from '@opengroove/common';

function calculateScore(votes: number, addedAt: number): number {
  const MAX_TIMESTAMP = 10000000000000;
  return votes * 1000000 + (MAX_TIMESTAMP - addedAt);
}

export async function addSong(
  roomId: string,
  youtubeUrl: string,
  userId: string,
  username: string
): Promise<Song> {
  if (!isValidYoutubeUrl(youtubeUrl)) {
    throw new Error('Invalid YouTube URL');
  }

  const youtubeId = parseYoutubeId(youtubeUrl);
  if (!youtubeId) {
    throw new Error('Could not extract YouTube video ID');
  }

  const song: Song = {
    id: generateId(),
    youtubeId,
    title: '',
    thumbnail: getYoutubeThumbnail(youtubeId),
    duration: 0,
    addedBy: userId,
    addedByUsername: username,
    votes: 0,
    votedBy: [],
    addedAt: Date.now(),
  };

  const score = calculateScore(song.votes, song.addedAt);

  await rClient.zAdd(REDIS_KEYS.ROOM_QUEUE(roomId), {
    score,
    value: JSON.stringify(song),
  });

  await rClient.expire(REDIS_KEYS.ROOM_QUEUE(roomId), ROOM_TTL);

  return song;
}

export async function getQueue(roomId: string): Promise<Song[]> {
  const songsData = await rClient.zRangeWithScores(
    REDIS_KEYS.ROOM_QUEUE(roomId),
    0,
    -1,
    { REV: true }
  );

  return songsData.map((item) => JSON.parse(item.value) as Song);
}

export async function removeSong(
  roomId: string,
  songId: string
): Promise<Song | null> {
  const queue = await getQueue(roomId);
  const song = queue.find((s) => s.id === songId);
  if (!song) return null;

  await rClient.zRem(
    REDIS_KEYS.ROOM_QUEUE(roomId),
    JSON.stringify(song)
  );

  return song;
}

export async function voteSong(
  roomId: string,
  songId: string,
  userId: string,
  voteType: 'up' | 'down'
): Promise<Song> {
  const queue = await getQueue(roomId);
  const song = queue.find((s) => s.id === songId);
  if (!song) {
    throw new Error('Song not found in queue');
  }

  if (song.votedBy.includes(userId)) {
    throw new Error('User has already voted on this song');
  }

  await rClient.zRem(
    REDIS_KEYS.ROOM_QUEUE(roomId),
    JSON.stringify(song)
  );

  const voteChange = voteType === 'up' ? 1 : -1;
  song.votes += voteChange;
  song.votedBy.push(userId);

  const newScore = calculateScore(song.votes, song.addedAt);

  await rClient.zAdd(REDIS_KEYS.ROOM_QUEUE(roomId), {
    score: newScore,
    value: JSON.stringify(song),
  });

  return song;
}

export async function getNextSong(roomId: string) {
  const queue = await getQueue(roomId);
  return queue.length > 0 ? queue[0] : null;
}

export async function isQueueEmpty(roomId: string): Promise<boolean> {
  const count = await rClient.zCard(REDIS_KEYS.ROOM_QUEUE(roomId));
  return count === 0;
}

export async function getQueueLength(roomId: string): Promise<number> {
  return await rClient.zCard(REDIS_KEYS.ROOM_QUEUE(roomId));
}
