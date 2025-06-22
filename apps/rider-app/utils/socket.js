import { io } from 'socket.io-client';

const socket = io('http://10.1.10.243:3000', {
  transports: ['websocket'],
  reconnection: true,
});

export default socket;
