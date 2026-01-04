import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  PlaybackControlPayload,
} from '@opengroove/common';

import {
  getNextSong,
  getQueue,
  removeSong,
} from '../../services/queue.service.js';

import { getPlaybackState, pause, play, seek, stop } from '../../services/playback.service.js';
import { refreshRoomTTL } from '../../services/room.service.js';

export function registerPlaybackHandlers(io: Server, socket: Socket) {
  socket.on(
    SOCKET_EVENTS.PLAYBACK_CONTROL,
    async (payload: PlaybackControlPayload) => {
      try {
        const { action, timestamp } = payload;
        const roomId = socket.data.roomId;

        if (!roomId) {
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
            success: false,
            error: 'You must be in a room',
          });
          return;
        }

        let playbackState;

        switch (action) {
          case 'play': {
            const nextSong = await getNextSong(roomId);

            if (!nextSong) {
              socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
                success: false,
                error: 'No songs in queue',
              });
              return;
            }

            playbackState = await play(roomId, nextSong);
            break;
          }

          case 'pause': {
            playbackState = await pause(roomId);
            break;
          }

          case 'seek': {
            if (timestamp === undefined) {
              socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
                success: false,
                error: 'Timestamp required for seek',
              });
              return;
            }

            playbackState = await seek(roomId, timestamp);
            break;
          }

          case 'next': {
            const currentState =
              await getPlaybackState(roomId);

            if (currentState?.currentSong) {
              await removeSong(
                roomId,
                currentState.currentSong.id
              );
            }

            const nextSong = await getNextSong(roomId);

            if (!nextSong) {
              await stop(roomId);

              io.to(roomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, {
                playbackState: null,
                queue: [],
              });
              return;
            }

            playbackState = await play(
              roomId,
              nextSong
            );
            break;
          }

          default:
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
              success: false,
              error: 'Invalid playback action',
            });
            return;
        }

        const queue = await getQueue(roomId);

        io.to(roomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, {
          playbackState,
          queue,
        });

        await refreshRoomTTL(roomId);
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to control playback',
        });
      }
    }
  );

  socket.on(SOCKET_EVENTS.SONG_ENDED, async () => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const currentState =
        await getPlaybackState(roomId);

      if (currentState?.currentSong) {
        await removeSong(
          roomId,
          currentState.currentSong.id
        );
      }

      const nextSong = await getNextSong(roomId);

      if (!nextSong) {
        await stop(roomId);

        io.to(roomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, {
          playbackState: null,
          queue: [],
        });
        return;
      }

      const playbackState = await play(
        roomId,
        nextSong
      );
      const queue = await getQueue(roomId);

      io.to(roomId).emit(SOCKET_EVENTS.PLAYBACK_STATE, {
        playbackState,
        queue,
      });

      await refreshRoomTTL(roomId);
    } catch {
      return;
    }
  });

  socket.on(SOCKET_EVENTS.PLAYBACK_SYNC, async () => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const playbackState =
        await getPlaybackState(roomId);
      const queue = await getQueue(roomId);

      socket.emit(SOCKET_EVENTS.PLAYBACK_STATE, {
        playbackState,
        queue,
      });
    } catch {
      return;
    }
  });
}
