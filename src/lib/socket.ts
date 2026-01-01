import { io, Socket } from "socket.io-client";
import { User } from "@/types/chat";

// internal state for socket and token
let socket: Socket | null = null;
let currentToken: string | null = null;
const listeners: Map<string, ((...args: any) => void)[]> = new Map();

// helper to setup default listeners
const setupDefaultListeners = () => {
  if (!socket) return;

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket?.id);
    // authenticate after connection if token is available
    if (currentToken) {
      console.log("🔐 Authenticating...");
      socket?.emit("authenticate", currentToken);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("error", (error) => {
    console.error("⚠️ Socket error:", error);
  });

  socket.on("connect_error", (error) => {
    console.error("⚠️ Connection error:", error);
  });

  socket.on("reconnecting", (attemptNumber) => {
    console.log("🔄 Reconnecting... Attempt:", attemptNumber);
  });

  socket.on("reconnect", (attemptNumber) => {
    console.log("✅ Reconnected after", attemptNumber, "attempts");
  });
};

export const initializeSocket = () => {
  if (socket) return socket;

  // initialize socket connection with default Socket.IO path
  socket = io("http://localhost:3000", {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    transports: ["polling", "websocket"],
  });

  setupDefaultListeners();
  return socket;
};

export const connect = (token: string) => {
  if (!socket) initializeSocket();
  
  currentToken = token;
  console.log("🔌 Connecting socket...");
  if (socket && !socket.connected) {
    socket.connect();
  } else if (socket?.connected) {
    // already connected, just authenticate
    socket.emit("authenticate", token);
  }
};

export const disconnect = () => {
  console.log("🔌 Disconnecting socket...");
  if (socket) {
    socket.disconnect();
  }
};

export const join = (user: User) => {
  console.log("👤 User joined:", user.name);
};

export const leave = () => {
  console.log("👋 Leaving...");
};

export const sendMessage = (data: {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
}) => {
  if (!socket?.connected) {
    console.warn("⚠️ Socket not connected, cannot send message");
    return;
  }

  const messageId =
    data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log("📤 Sending message:", data.content.substring(0, 50));

  socket.emit("message", {
    id: messageId,
    content: data.content,
    senderId: data.senderId,
    senderName: data.senderName,
    timestamp: new Date().toISOString(),
  });
};

export const sendTyping = (isTyping: boolean) => {
  if (!socket?.connected) return;

  if (isTyping) {
    socket.emit("typing");
  } else {
    socket.emit("stopTyping");
  }
};

export const markAsRead = (messageId: string) => {
  if (!socket?.connected) return;
  socket.emit("markRead", messageId);
};

// event listener methods
export const on = (event: string, callback: (...args: any) => void) => {
  if (!socket) initializeSocket();
  socket?.on(event, callback);
};

export const off = (event: string, callback?: (...args: any) => void) => {
  if (callback) {
    socket?.off(event, callback);
  } else {
    socket?.off(event);
  }
};

// for testing purposes
export const simulateDisconnect = () => {
  socket?.disconnect();
};

export const getConnected = (): boolean => {
  return socket?.connected || false;
};

// internal getSocket for direct access if needed
export const getSocketInstance = () => {
  if (!socket) initializeSocket();
  return socket;
};

// compatibility object to mimic the old class instance structure
export const getSocket = () => {
  if (!socket) initializeSocket();
  
  return {
    connect,
    disconnect,
    join,
    leave,
    sendMessage,
    sendTyping,
    markAsRead,
    on,
    off,
    simulateDisconnect,
    // property getter workaround for 'connected'
    get connected() {
      return getConnected();
    }
  };
};

export const resetSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
