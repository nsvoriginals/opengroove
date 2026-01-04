import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  VotePayload,
} from '@opengroove/common';

import {
  voteSong,
  getQueue,
} from '../../services/queue.service.js';

export function registerVoteHandlers(io: Server, socket: Socket) {
  socket.on(
    SOCKET_EVENTS.VOTE_SONG,
    async (payload: VotePayload) => {
      try {
        const { songId, voteType } = payload;
        const roomId = socket.data.roomId;
        const userId = socket.data.userId;
        const username = socket.data.username;

        if (!roomId) {
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
            success: false,
            error: 'You must be in a room to vote',
          });
          return;
        }

        const updatedSong = await voteSong(
          roomId,
          songId,
          userId,
          voteType
        );

        const queue = await getQueue(roomId);

        io.to(roomId).emit(SOCKET_EVENTS.QUEUE_UPDATED, {
          queue,
          votedSong: updatedSong,
        });

        socket.emit(SOCKET_EVENTS.SONG_VOTED, {
          success: true,
          song: updatedSong,
        });
      } catch (error) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to vote on song',
        });
      }
    }
  );
}
