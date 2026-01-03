export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',


    CREATE_ROOM: 'room:create',
    JOIN_ROOM: 'room:join',
    LEAVE_ROOM: 'room:leave',
    ROOM_CREATED: 'room:created',
    ROOM_JOINED: 'room:joined',
    ROOM_UPDATED: 'room:updated',
    ROOM_ERROR: 'room:error',
    USER_JOINED: 'user:joined',
    USER_LEFT: 'user:left',


    ADD_SONG: 'queue:add',
    REMOVE_SONG: 'queue:remove',
    QUEUE_UPDATED: 'queue:updated',
    SONG_ADDED: 'queue:song-added',


    VOTE_SONG: 'song:vote',
    SONG_VOTED: 'song:voted',
    PLAYBACK_CONTROL: 'playback:control',
    PLAYBACK_STATE: 'playback:state',
    PLAYBACK_SYNC: 'playback:sync',
    SONG_ENDED: 'playback:ended',
    NEXT_SONG: 'playback:next',
} as const;

export const REDIS_KEYS = {
  ROOM: (roomId: string) => `room:${roomId}`,
  ROOM_QUEUE: (roomId: string) => `room:${roomId}:queue`,
  ROOM_USERS: (roomId: string) => `room:${roomId}:users`,
  ROOM_PLAYBACK: (roomId: string) => `room:${roomId}:playback`,
  ROOM_CODE: (code: string) => `room:code:${code}`,
  USER: (userId: string) => `user:${userId}`,
} as const;



export const ROOM_CODE_LENGTH = 6;
export const MAX_ROOM_NAME_LENGTH = 50;
export const MAX_USERNAME_LENGTH = 30;
export const MAX_QUEUE_SIZE = 50;
export const ROOM_TTL = 24 * 60 * 60; // 24 hours in seconds
export const USER_TTL = 60 * 60; 


export const YOUTUBE_URL_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;