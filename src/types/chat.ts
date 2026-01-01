export interface Message {
  id: string;
  content: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  avatar: string;
  isTyping?: boolean;
  lastSeen?: Date;
}

export interface ChatState {
  messages: Message[];
  users: User[];
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  currentUser: User | null;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

export interface MessagePayload {
  content: string;
  senderId: string;
  senderName: string;
}

export interface SocketEvents {
  // Client -> Server
  sendMessage: (payload: MessagePayload) => void;
  typing: (isTyping: boolean) => void;
  join: (user: User) => void;
  leave: () => void;

  // Server -> Client
  message: (message: Message) => void;
  messageConfirmed: (messageId: string) => void;
  userTyping: (user: TypingUser) => void;
  userStoppedTyping: (userId: string) => void;
  userJoined: (user: User) => void;
  userLeft: (userId: string) => void;
  userList: (users: User[]) => void;
}
