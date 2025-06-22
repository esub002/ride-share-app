const { io } = require("socket.io-client");

// Replace with your backend IP
const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  reconnection: true
});

socket.on("connect", () => {
  console.log("✅ Connected as client:", socket.id);

  // Choose mode: rider or driver
  const mode = process.argv[2];
  const isDriver = mode === 'driver';

  if (isDriver) {
    // DRIVER FLOW
    const driverId = 2;
    socket.emit("driver:available", { driverId });

    socket.on("ride:incoming", (data) => {
      console.log("📥 Incoming Ride:", data);

      // Auto-accept the ride
      socket.emit("ride:accept", {
        rideId: data.rideId,
        driverId
      });
    });
  } else {
    // RIDER FLOW
    const riderId = 1;

    socket.emit("ride:request", {
      origin: "Central Park",
      destination: "Wall Street",
      riderId
    });

    socket.on("ride:assigned", (ride) => {
      console.log("🎉 Ride Assigned:", ride);
    });

    socket.on("ride:noDrivers", () => {
      console.log("🚫 No drivers available.");
    });
  }
});
