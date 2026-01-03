
export const socketConfig = {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket'],
  pingTimeout: 20000,
  pingInterval: 25000
};
