import { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  CreateRoomPayload,
  JoinRoomPayload,
  User,
} from '@opengroove/common';
import { addUserToRoom, createRoom, getRoom, getRoomByCode, getRoomUsers, removeUserFromRoom } from '../../services/room.service.js';
import { getPlaybackState } from '../../services/playback.service.js';

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.CREATE_ROOM, async (payload: CreateRoomPayload) => {
    try {
      const { roomName, username } = payload;
      const userId = socket.id;

      const room = await createRoom(roomName, userId);

      const user: User = {
        id: userId,
        username,
        roomId: room.id,
        joinedAt: Date.now(),
      };

      await addUserToRoom(room.id, user);
      socket.join(room.id);

      socket.data.roomId = room.id;
      socket.data.userId = userId;
      socket.data.username = username;

      socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
        success: true,
        room,
        user,
      });
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create room',
      });
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload: JoinRoomPayload) => {
    try {
      const { roomCode, username } = payload;
      const userId = socket.id;

      const room = await getRoomByCode(roomCode);
      if (!room) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          success: false,
          error: 'Room not found. Please check the code.',
        });
        return;
      }

      const user: User = {
        id: userId,
        username,
        roomId: room.id,
        joinedAt: Date.now(),
      };

      await addUserToRoom(room.id, user);
      socket.join(room.id);

      socket.data.roomId = room.id;
      socket.data.userId = userId;
      socket.data.username = username;

      const users = await getRoomUsers(room.id);
      const queue = await (room.id);
      const playbackState = await getPlaybackState(room.id);

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        success: true,
        room,
        user,
        users,
        queue,
        playbackState,
      });

      socket.to(room.id).emit(SOCKET_EVENTS.USER_JOINED, {
        user,
        room,
      });

      const updatedRoom = await getRoom(room.id);
      io.to(room.id).emit(SOCKET_EVENTS.ROOM_UPDATED, { room: updatedRoom });
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to join room',
      });
    }
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, async () => {
    await handleUserLeaving(io, socket);
  });

  socket.on('disconnect', async () => {
    await handleUserLeaving(io, socket);
  });
}

async function handleUserLeaving(io: Server, socket: Socket) {
  const roomId = socket.data.roomId;
  const userId = socket.data.userId;
  const username = socket.data.username;

  if (!roomId || !userId) return;

  try {
    await removeUserFromRoom(roomId, userId);
    socket.leave(roomId);

    socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, {
      userId,
      username,
    });

    const room = await getRoom(roomId);
    if (room) {
      io.to(roomId).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    }

    socket.data.roomId = null;
    socket.data.userId = null;
    socket.data.username = null;
  } catch {}
}
