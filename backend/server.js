import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes    from "./routes/auth.routes.js";
import locationRoutes from "./routes/location.routes.js";
import rideRoutes    from "./routes/ride.routes.js";
import driverRoutes  from "./routes/driver.routes.js";
import earningRoutes from "./routes/earning.routes.js";
import ratingRoutes  from "./routes/rating.routes.js";
import chatRoutes    from "./routes/chat.routes.js";
import walletRoutes  from "./routes/wallet.routes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

/* ════════════════════════════════════════
   SOCKET.IO SETUP
════════════════════════════════════════ */
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

// In-memory stores
let onlineDrivers = {};  // { socketId: { userId, lat, lng } }
let driverSockets = {};  // { userId: socketId }
let userSockets   = {};  // { userId: socketId }

io.on("connection", (socket) => {
  console.log("⚡ Connected:", socket.id);

  // ── Rider registers
  socket.on("register-user", (userId) => {
    userSockets[userId] = socket.id;
    console.log("👤 Rider:", userId);
  });

  // ── Join ride room (both rider & driver)
  socket.on("join-ride", (rideId) => {
    socket.join(rideId);
    console.log(`🚗 Joined ride room: ${rideId}`);
  });

  // ── Driver comes online
  socket.on("driver-online", ({ userId, lat, lng }) => {
    onlineDrivers[socket.id] = { userId, lat, lng };
    driverSockets[userId] = socket.id;
  });

  // ── Driver live location broadcast
  socket.on("driver-location", ({ rideId, lat, lng }) => {
    // Update store
    if (onlineDrivers[socket.id]) {
      onlineDrivers[socket.id].lat = lat;
      onlineDrivers[socket.id].lng = lng;
    }
    // Broadcast to ride room
    io.to(rideId).emit("driver-location", { lat, lng });
  });

  // ── Chat typing indicator
  socket.on("typing", ({ rideId, role }) => {
    socket.to(rideId).emit("typing", { role });
  });

  socket.on("stop-typing", ({ rideId }) => {
    socket.to(rideId).emit("stop-typing");
  });

  // ── Disconnect
  socket.on("disconnect", () => {
    delete onlineDrivers[socket.id];

    for (const id in driverSockets) {
      if (driverSockets[id] === socket.id) delete driverSockets[id];
    }
    for (const id in userSockets) {
      if (userSockets[id] === socket.id) delete userSockets[id];
    }

    console.log("❌ Disconnected:", socket.id);
  });
});

/* ════════════════════════════════════════
   MIDDLEWARE
════════════════════════════════════════ */
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

/* ════════════════════════════════════════
   ROUTES
════════════════════════════════════════ */
app.use("/api/auth",     authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/ride",     rideRoutes);
app.use("/api/driver",   driverRoutes);
app.use("/api/earnings", earningRoutes);
app.use("/api/ratings",  ratingRoutes);
app.use("/api/chat",     chatRoutes);
app.use("/api/wallet",   walletRoutes);

app.get("/", (_, res) => res.send("🚀 RideSphere Backend Running"));

/* ════════════════════════════════════════
   START
════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));

export { io, onlineDrivers, driverSockets, userSockets };
