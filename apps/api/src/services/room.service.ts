import {
  Room,
  User,
  REDIS_KEYS,
  ROOM_TTL,
  generateRoomCode,
  generateId,
  isValidRoomName
} from "@opengroove/common";

import { rClient } from "../config/redis.config.js";


export async function createRoom(
  roomName: string,
  creatorId: string
): Promise<Room> {
  if (!isValidRoomName(roomName)) {
    throw new Error("Invalid room name");
  }

  const roomId = generateId();
  const code = await generateUniqueCode();

  const room: Room = {
    id: roomId,
    name: roomName,
    code,
    createdAt: Date.now(),
    userCount: 0
  };

  await rClient.setEx(
    REDIS_KEYS.ROOM(roomId),
    ROOM_TTL,
    JSON.stringify(room)
  );

  await rClient.setEx(
    REDIS_KEYS.ROOM_CODE(code),
    ROOM_TTL,
    roomId
  );

  console.log(`Room created: ${roomId} (${code})`);
  return room;
}


export async function getRoom(roomId: string): Promise<Room | null> {
  const data = await rClient.get(REDIS_KEYS.ROOM(roomId));
  if (!data) return null;

  return JSON.parse(data) as Room;
}


export async function getRoomByCode(code: string): Promise<Room | null> {
  const roomId = await rClient.get(REDIS_KEYS.ROOM_CODE(code));
  if (!roomId) return null;

  return getRoom(roomId);
}


export async function addUserToRoom(
  roomId: string,
  user: User
): Promise<void> {
  await rClient.sAdd(
    REDIS_KEYS.ROOM_USERS(roomId),
    JSON.stringify(user)
  );

  const room = await getRoom(roomId);
  if (room) {
    room.userCount++;

    await rClient.setEx(
      REDIS_KEYS.ROOM(roomId),
      ROOM_TTL,
      JSON.stringify(room)
    );
  }

  await rClient.expire(REDIS_KEYS.ROOM_USERS(roomId), ROOM_TTL);
  await rClient.expire(REDIS_KEYS.ROOM_QUEUE(roomId), ROOM_TTL);

  console.log(`User ${user.username} added to room ${roomId}`);
}


export async function removeUserFromRoom(
  roomId: string,
  userId: string
): Promise<void> {
  const usersData = await rClient.sMembers(
    REDIS_KEYS.ROOM_USERS(roomId)
  );

  const users = usersData.map(u => JSON.parse(u) as User);
  const user = users.find(u => u.id === userId);

  if (!user) return;

  await rClient.sRem(
    REDIS_KEYS.ROOM_USERS(roomId),
    JSON.stringify(user)
  );

  const room = await getRoom(roomId);
  if (!room) return;

  room.userCount = Math.max(0, room.userCount - 1);

  if (room.userCount === 0) {
    await cleanupEmptyRoom(roomId, room.code);
  } else {
    await rClient.setEx(
      REDIS_KEYS.ROOM(roomId),
      ROOM_TTL,
      JSON.stringify(room)
    );
  }

  console.log(`User ${userId} removed from room ${roomId}`);
}

export async function getRoomUsers(roomId: string): Promise<User[]> {
  const usersData = await rClient.sMembers(
    REDIS_KEYS.ROOM_USERS(roomId)
  );

  return usersData.map(u => JSON.parse(u) as User);
}


export async function roomExists(roomId: string): Promise<boolean> {
  return (await rClient.exists(REDIS_KEYS.ROOM(roomId))) === 1;
}


export async function refreshRoomTTL(roomId: string): Promise<void> {
  await Promise.all([
    rClient.expire(REDIS_KEYS.ROOM(roomId), ROOM_TTL),
    rClient.expire(REDIS_KEYS.ROOM_USERS(roomId), ROOM_TTL),
    rClient.expire(REDIS_KEYS.ROOM_QUEUE(roomId), ROOM_TTL),
    rClient.expire(REDIS_KEYS.ROOM_PLAYBACK(roomId), ROOM_TTL)
  ]);
}


async function cleanupEmptyRoom(
  roomId: string,
  code: string
): Promise<void> {
  await Promise.all([
    rClient.del(REDIS_KEYS.ROOM(roomId)),
    rClient.del(REDIS_KEYS.ROOM_CODE(code)),
    rClient.del(REDIS_KEYS.ROOM_USERS(roomId)),
    rClient.del(REDIS_KEYS.ROOM_QUEUE(roomId)),
    rClient.del(REDIS_KEYS.ROOM_PLAYBACK(roomId))
  ]);

  console.log(`Room ${roomId} cleaned up (empty)`);
}

async function generateUniqueCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateRoomCode();
    const exists =
      (await rClient.exists(REDIS_KEYS.ROOM_CODE(code))) === 1;

    if (!exists) return code;
    attempts++;
  }

  throw new Error("Failed to generate unique room code");
}
