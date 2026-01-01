import { io, Socket } from "socket.io-client";
import { User } from "@/types/chat";

export class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor() {
    // initialize socket connection with default Socket.IO path
    this.socket = io("http://localhost:3000", {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ["polling", "websocket"],
    });

    this.setupDefaultListeners();
  }

  private setupDefaultListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      // Authenticate after connection if token is available
      if (this.token) {
        console.log("🔐 Authenticating...");
        this.socket?.emit("authenticate", this.token);
      }
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("error", (error) => {
      console.error("⚠️ Socket error:", error);
    });

    this.socket.on("connect_error", (error) => {
      console.error("⚠️ Connection error:", error);
    });

    this.socket.on("reconnecting", (attemptNumber) => {
      console.log("🔄 Reconnecting... Attempt:", attemptNumber);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("✅ Reconnected after", attemptNumber, "attempts");
    });
  }

  connect(token: string) {
    this.token = token;
    console.log("🔌 Connecting socket...");
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    } else if (this.socket?.connected) {
      // Already connected, just authenticate
      this.socket.emit("authenticate", token);
    }
  }

  disconnect() {
    console.log("🔌 Disconnecting socket...");
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  join(user: User) {
    console.log("👤 User joined:", user.name);
  }

  leave() {
    console.log("👋 Leaving...");
  }

  sendMessage(data: {
    id?: string;
    content: string;
    senderId: string;
    senderName: string;
  }) {
    if (!this.socket?.connected) {
      console.warn("⚠️ Socket not connected, cannot send message");
      return;
    }

    const messageId =
      data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log("📤 Sending message:", data.content.substring(0, 50));

    this.socket.emit("message", {
      id: messageId,
      content: data.content,
      senderId: data.senderId,
      senderName: data.senderName,
      timestamp: new Date().toISOString(),
    });
  }

  sendTyping(isTyping: boolean) {
    if (!this.socket?.connected) return;

    if (isTyping) {
      this.socket.emit("typing");
    } else {
      this.socket.emit("stopTyping");
    }
  }

  markAsRead(messageId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit("markRead", messageId);
  }

  // Event listener methods
  on(event: string, callback: (...args: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // For testing purposes
  simulateDisconnect() {
    this.socket?.disconnect();
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
let socketInstance: SocketClient | null = null;

export function getSocket(): SocketClient {
  if (!socketInstance) {
    socketInstance = new SocketClient();
  }
  return socketInstance;
}

export function resetSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
