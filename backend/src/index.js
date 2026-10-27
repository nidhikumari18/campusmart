
import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import http from "node:http";
import jwt from "jsonwebtoken";

import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

import User from "./models/User.js";
import Conversation from "./models/Conversation.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

// ========================================
// ENVIRONMENT VARIABLES
// ========================================

const requiredEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLIENT_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable: ${key}`
    );
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be at least 32 characters."
  );
}

// ========================================
// EXPRESS MIDDLEWARE
// ========================================

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Serve uploaded product images
app.use(
  "/uploads",
  express.static(
    path.resolve(process.cwd(), "uploads")
  )
);

// ========================================
// HTTP SERVER + SOCKET.IO
// ========================================

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// ========================================
// SOCKET AUTHENTICATION
// ========================================

// Read the JWT from the same httpOnly cookie
// used by the Express authentication system.

io.use(async (socket, next) => {
  try {
    const cookies = cookieParser.JSONCookies(
      Object.fromEntries(
        (socket.handshake.headers.cookie || "")
          .split(";")
          .map((part) => {
            const index = part.indexOf("=");

            if (index === -1) {
              return ["", ""];
            }

            return [
              part.slice(0, index).trim(),
              decodeURIComponent(
                part.slice(index + 1).trim()
              ),
            ];
          })
          .filter(([key]) => key)
      )
    );

    const token = cookies.token;

    if (!token) {
      return next(
        new Error("Authentication required.")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    const user = await User.findById(decoded.id)
      .select("_id name");

    if (!user) {
      return next(
        new Error("User not found.")
      );
    }

    socket.data.userId = String(user._id);

    next();
  } catch (error) {
    console.error(
      "Socket authentication failed:",
      error.message
    );

    next(new Error("Invalid authentication."));
  }
});

// ========================================
// SOCKET CONNECTIONS
// ========================================

io.on("connection", (socket) => {
  const userId = socket.data.userId;

  console.log(
    "Authenticated socket connected:",
    socket.id,
    "User:",
    userId
  );

  // Each authenticated user gets a private room.
  socket.join(`user:${userId}`);

  socket.emit("connection:ready", {
    message: "Connected to CampusMart chat",
    userId,
  });

  // ======================================
  // JOIN A CONVERSATION
  // ======================================

  socket.on(
    "conversation:join",
    async (conversationId, callback) => {
      try {
        if (
          !mongoose.isValidObjectId(conversationId)
        ) {
          throw new Error(
            "Invalid conversation ID."
          );
        }

        const conversation =
          await Conversation.findOne({
            _id: conversationId,
            $or: [
              { buyer: userId },
              { seller: userId },
            ],
          });

        if (!conversation) {
          throw new Error(
            "Conversation not found or access denied."
          );
        }

        socket.join(
          `conversation:${conversation._id}`
        );

        if (typeof callback === "function") {
          callback({
            ok: true,
            conversationId:
              String(conversation._id),
          });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({
            ok: false,
            message: error.message,
          });
        }
      }
    }
  );

  // ======================================
  // LEAVE A CONVERSATION
  // ======================================

  socket.on("conversation:leave", (conversationId) => {
    if (!mongoose.isValidObjectId(conversationId)) {
      return;
    }

    socket.leave(`conversation:${conversationId}`);
  });

  // ======================================
  // DISCONNECT
  // ======================================

  socket.on("disconnect", (reason) => {
    console.log(
      "Socket disconnected:",
      socket.id,
      reason
    );
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/messages", messageRoutes);

// Make Socket.IO available to authenticated
// messaging route handlers.
app.set("io", io);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "CampusMart API is running",

    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",

    realtime: "enabled",
  });
});

// ========================================
// UNKNOWN API ROUTES
// ========================================

app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found.",
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message:
        "Each image must be 5 MB or smaller.",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message:
        "You can upload a maximum of 5 images.",
    });
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Something went wrong.",
  });
});

// ========================================
// START SERVER
// ========================================

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(
      process.env.MONGODB_URI.trim(),
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(
      "MongoDB connected successfully!"
    );

    httpServer.listen(PORT, () => {
      console.log(
        `CampusMart API running at http://localhost:${PORT}`
      );

      console.log(
        "Authenticated Socket.IO server is ready!"
      );

      console.log(
        "Messaging API routes registered!"
      );
    });
  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
