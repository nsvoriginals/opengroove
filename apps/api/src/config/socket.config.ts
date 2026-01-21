
import { ServerOptions } from "socket.io";
export const socketConfig: Partial<ServerOptions> = {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  },
  transports: ['websocket'] ,
  pingTimeout: 20000,
  pingInterval: 25000
};
