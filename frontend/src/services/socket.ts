import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_API_URL || window.location.origin;
    socket = io(serverUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};
