import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  AddSongPayload,
} from '@opengroove/common';
import {
  addSong,
  getQueue,
  removeSong,
} from '../../services/queue.service.js';
import { refreshRoomTTL } from '../../services/room.service.js';

export function registerQueueHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.ADD_SONG, async (payload: AddSongPayload) => {
    try {
      const { youtubeUrl } = payload;
      const roomId = socket.data.roomId;
      const userId = socket.data.userId;
      const username = socket.data.username || 'Anonymous';

      if (!roomId) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          success: false,
          error: 'You must be in a room to add songs',
        });
        return;
      }

      const song = await addSong(
        roomId,
        youtubeUrl,
        userId,
        username
      );

      const queue = await getQueue(roomId);

      io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATED, {
        queue,
        addedSong: song,
      });

      await refreshRoomTTL(roomId);
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add song',
      });
    }
  });

  socket.on(
    SOCKET_EVENTS.REMOVE_SONG,
    async (payload: { songId: string }) => {
      try {
        const { songId } = payload;
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;

        if (!roomId) {
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
            success: false,
            error: 'You must be in a room',
          });
          return;
        }

        const queue = await getQueue(roomId);
        const song = queue.find((s) => s.id === songId);

        if (!song) {
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
            success: false,
            error: 'Song not found',
          });
          return;
        }

        if (song.addedBy !== userId) {
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
            success: false,
            error: 'You can only remove songs you added',
          });
          return;
        }

        await removeSong(roomId, songId);

        const updatedQueue = await getQueue(roomId);

        io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATED, {
          queue: updatedQueue,
          removedSongId: songId,
        });

        await refreshRoomTTL(roomId);
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to remove song',
        });
      }
    }
  );
}
