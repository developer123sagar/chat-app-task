/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

// store online users: userId -> set of socket IDs
const onlineUsers = new Map();

// helper function to broadcast online users (outside connection handler)
async function broadcastOnlineUsers(io) {
  try {
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    const usersWithStatus = allUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isOnline: onlineUsers.has(user.id),
    }));

    io.emit("userList", usersWithStatus);
    console.log(
      `Broadcasting ${usersWithStatus.length} users, ${onlineUsers.size} online`
    );
  } catch (error) {
    console.error("Error broadcasting online users:", error);
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // initialize Socket.IO with default path
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    // use default Socket.IO path: /socket.io/
    transports: ["polling", "websocket"],
    allowEIO3: true,
  });

  console.log("Socket.IO server initialized on default path /socket.io/");

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentUser = null;

    // immediately send user list on connection (before auth)
    broadcastOnlineUsers(io);

    // authentication
    socket.on("authenticate", async (token) => {
      try {
        const jwt = require("jsonwebtoken");
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || "fallback-secret"
        );

        currentUser = payload;

        // add to online users
        if (!onlineUsers.has(payload.userId)) {
          onlineUsers.set(payload.userId, new Set());
        }
        onlineUsers.get(payload.userId).add(socket.id);

        console.log(`User authenticated: ${payload.name} (${payload.userId})`);

        // emit user joined
        io.emit("userJoined", {
          id: payload.userId,
          name: payload.name,
          isOnline: true,
        });

        // broadcast updated online users list
        await broadcastOnlineUsers(io);
      } catch (error) {
        console.error("Authentication error:", error);
        socket.emit("error", { message: "Invalid token" });
        socket.disconnect();
      }
    });

    // handle incoming messages
    socket.on("message", (data) => {
      if (!currentUser) {
        console.warn("Message from unauthenticated user");
        return;
      }

      console.log(`Message from ${currentUser.name}:`, data.content);

      // broadcast message to all clients
      io.emit("message", {
        id: data.id,
        content: data.content,
        senderId: data.senderId,
        senderName: data.senderName,
        timestamp: data.timestamp,
        status: "sent",
      });

      // confirm message delivery
      socket.emit("messageConfirmed", data.id);
    });

    // handle typing indicator
    socket.on("typing", () => {
      if (!currentUser) return;

      socket.broadcast.emit("userTyping", {
        userId: currentUser.userId,
        userName: currentUser.name,
      });
    });

    // handle stop typing
    socket.on("stopTyping", () => {
      if (!currentUser) return;

      socket.broadcast.emit("userStoppedTyping", currentUser.userId);
    });

    // handle message read receipt
    socket.on("markRead", async (messageId) => {
      if (!currentUser) return;

      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (message && !message.readBy.includes(currentUser.userId)) {
          await prisma.message.update({
            where: { id: messageId },
            data: {
              readBy: [...message.readBy, currentUser.userId],
              status: "read",
            },
          });

          io.emit("messageRead", {
            messageId,
            userId: currentUser.userId,
          });
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // handle disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);

      if (currentUser) {
        const userSockets = onlineUsers.get(currentUser.userId);

        if (userSockets) {
          userSockets.delete(socket.id);

          if (userSockets.size === 0) {
            onlineUsers.delete(currentUser.userId);
            console.log(`User went offline: ${currentUser.name}`);

            io.emit("userLeft", currentUser.userId);
            io.emit("userStoppedTyping", currentUser.userId);
          }
        }

        await broadcastOnlineUsers(io);
      }
    });
  });

  httpServer.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log("> Socket.IO server is running on /socket.io/");
  });
});
