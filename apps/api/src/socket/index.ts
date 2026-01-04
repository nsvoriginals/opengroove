import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";

import { registerRoomHandlers } from "./handlers/room.handler.js";
import { registerVoteHandlers } from "./handlers/vote.handler.js";
import { registerPlaybackHandlers } from "./handlers/playback.handler.js";
import { registerQueueHandlers } from "./handlers/queue.handler.js";
import { socketConfig } from "../config/socket.config.js";

export function initSocketLayer(httpServer: HTTPServer) {
  const io = new Server(httpServer, socketConfig);

  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerPlaybackHandlers(io, socket);
    registerQueueHandlers(io, socket);
    registerVoteHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}
