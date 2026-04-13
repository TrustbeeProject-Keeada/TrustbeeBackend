import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { startCronJobs } from "./utils/cronJobs.js";
import jwt from "jsonwebtoken";

dotenv.config();

// Non-sensitive runtime check to help debug missing JWT_SECRET issues
console.log(
  "JWT_SECRET present?",
  !!process.env.JWT_SECRET,
  "JWT_SECRET length:",
  process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
);

const PORT = process.env.PORT || 3000;

export const userSocketMap = new Map<string, string>();

const startServer = async () => {
  try {
    console.info("DB CONNECTED");

    const app = createApp();

    // Integrate Socket.IO
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    app.set("io", io);

    // Middleware to authenticate Socket.IO connections using JWT tokens
    io.use((socket, next) => {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.token;
      if (!token) {
        const err = new Error("Authentication error: No token provided");
        err.name = "AuthenticationError";
        return next(err);
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
          id: number;
          role: string;
        };
        socket.data.user = decoded;
        next();
      } catch (error) {
        const err = new Error("Authentication error: Invalid token");
        err.name = "AuthenticationError";
        return next(err);
      }
    });
    io.on("connection", (socket) => {
      console.log(`New WebSockets connection: ${socket.id}`);
      const userId = socket.data.user.id;
      const role = socket.data.user.role;
      const uniqueKey = `${role}:${userId}`;

      userSocketMap.set(uniqueKey, socket.id);
      console.log(`Secure connection established for ${uniqueKey}`);

      socket.on("disconnect", () => {
        userSocketMap.delete(uniqueKey);
        console.log(`WebSockets disconnected for ${uniqueKey}`);
      });
    });

    // Cron Jobs
    startCronJobs();
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("DB NOT CONNECTED", error);
    process.exit(1);
  }
};

startServer();
