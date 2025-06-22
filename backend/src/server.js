const app = require('./app');
const { Server } = require('socket.io');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

const driversAvailable = new Map(); // key: socket.id, value: driverId

io.on('connection', socket => {
  console.log('Socket connected:', socket.id);

  socket.on('driver:available', async ({ driverId }) => {
    driversAvailable.set(socket.id, driverId);
    console.log(`Driver ${driverId} is now available`);
  });

  socket.on('ride:request', async ({ origin, destination, riderId }) => {
    const ride = await prisma.ride.create({
      data: { origin, destination, status: 'requested', riderId }
    });

    const [firstDriverSocket] = driversAvailable.keys();

    if (firstDriverSocket) {
      io.to(firstDriverSocket).emit('ride:incoming', {
        rideId: ride.id,
        origin,
        destination,
        riderId
      });
    } else {
      io.to(socket.id).emit('ride:noDrivers');
    }
  });

  socket.on('ride:accept', async ({ rideId, driverId }) => {
    const ride = await prisma.ride.update({
      where: { id: rideId },
      data: { driverId, status: 'ongoing' }
    });

    io.emit('ride:assigned', { ride }); // broadcast to all riders
  });

  socket.on('disconnect', () => {
    driversAvailable.delete(socket.id);
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
