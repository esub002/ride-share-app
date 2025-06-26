import { io } from 'socket.io-client';

const socket = io('http://10.1.10.243:3000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  forceNew: true,
  autoConnect: false,
});

let isConnecting = false;

export const connectSocket = () => {
  if (!socket.connected && !isConnecting) {
    isConnecting = true;
    socket.connect();
    
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      isConnecting = false;
    });
    
    socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
      isConnecting = false;
    });
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket; 