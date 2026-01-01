"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSocket, SocketClient } from "@/lib/socket";
import { Message, User, TypingUser } from "@/types/chat";
import { apiClient } from "@/lib/api";

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

interface UseWebSocketOptions {
  currentUser: User | null;
  onMessage?: (message: Message) => void;
  onMessageConfirmed?: (messageId: string) => void;
  onUserTyping?: (user: TypingUser) => void;
  onUserStoppedTyping?: (userId: string) => void;
  onUserJoined?: (user: User) => void;
  onUserLeft?: (userId: string) => void;
  onUserList?: (users: User[]) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  sendMessage: (content: string) => string;
  sendTyping: (isTyping: boolean) => void;
  disconnect: () => void;
  reconnect: () => void;
  simulateDisconnect: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    currentUser,
    onMessage,
    onMessageConfirmed,
    onUserTyping,
    onUserStoppedTyping,
    onUserJoined,
    onUserLeft,
    onUserList,
    onConnectionChange,
  } = options;

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const socketRef = useRef<SocketClient | null>(null);
  const messageQueueRef = useRef<string[]>([]);

  // store latest callbacks in refs to avoid re-registering listeners
  const onMessageRef = useRef(onMessage);
  const onMessageConfirmedRef = useRef(onMessageConfirmed);
  const onUserTypingRef = useRef(onUserTyping);
  const onUserStoppedTypingRef = useRef(onUserStoppedTyping);
  const onUserJoinedRef = useRef(onUserJoined);
  const onUserLeftRef = useRef(onUserLeft);
  const onUserListRef = useRef(onUserList);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onMessageConfirmedRef.current = onMessageConfirmed;
    onUserTypingRef.current = onUserTyping;
    onUserStoppedTypingRef.current = onUserStoppedTyping;
    onUserJoinedRef.current = onUserJoined;
    onUserLeftRef.current = onUserLeft;
    onUserListRef.current = onUserList;
    onConnectionChangeRef.current = onConnectionChange;
  });

  // initialize socket connection
  useEffect(() => {
    // only connect if we have a current user (authenticated)
    if (!currentUser) {
      return;
    }

    const token = apiClient.getToken();
    if (!token) {
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // connect with JWT token
    socket.connect(token);

    // define event handlers that use refs
    const handleConnect = () => {
      setConnectionStatus("connected");
      onConnectionChangeRef.current?.("connected");

      // send queued messages after reconnection
      messageQueueRef.current.forEach((msg) => {
        socket.sendMessage({
          content: msg,
          senderId: currentUser.id,
          senderName: currentUser.name,
        });
      });
      messageQueueRef.current = [];

      // join the chat with authenticated user
      socket.join(currentUser);
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
      onConnectionChangeRef.current?.("disconnected");
    };

    const handleReconnecting = () => {
      setConnectionStatus("reconnecting");
      onConnectionChangeRef.current?.("reconnecting");
    };

    const handleMessage = (message: Message) => {
      onMessageRef.current?.(message);
    };

    const handleMessageConfirmed = (messageId: string) => {
      onMessageConfirmedRef.current?.(messageId);
    };

    const handleUserTyping = (user: TypingUser) => {
      onUserTypingRef.current?.(user);
    };

    const handleUserStoppedTyping = (userId: string) => {
      onUserStoppedTypingRef.current?.(userId);
    };

    const handleUserJoined = (user: User) => {
      onUserJoinedRef.current?.(user);
    };

    const handleUserLeft = (userId: string) => {
      onUserLeftRef.current?.(userId);
    };

    const handleUserList = (users: User[]) => {
      onUserListRef.current?.(users);
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("reconnecting", handleReconnecting);
    socket.on("message", handleMessage);
    socket.on("messageConfirmed", handleMessageConfirmed);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("userJoined", handleUserJoined);
    socket.on("userLeft", handleUserLeft);
    socket.on("userList", handleUserList);

    // cleanup - remove all event listeners
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("reconnecting", handleReconnecting);
      socket.off("message", handleMessage);
      socket.off("messageConfirmed", handleMessageConfirmed);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("userJoined", handleUserJoined);
      socket.off("userLeft", handleUserLeft);
      socket.off("userList", handleUserList);

      socket.leave();
      socket.disconnect();
    };
  }, [currentUser]);

  // handle send message
  const sendMessage = useCallback(
    (content: string): string => {
      const messageId = uuidv4();

      if (
        connectionStatus === "connected" &&
        socketRef.current &&
        currentUser
      ) {
        socketRef.current.sendMessage({
          content,
          senderId: currentUser.id,
          senderName: currentUser.name,
        });
      } else {
        // Queue message for later
        messageQueueRef.current.push(content);
      }

      return messageId;
    },
    [connectionStatus, currentUser]
  );

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    socketRef.current?.sendTyping(isTyping);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  // Reconnect
  const reconnect = useCallback(() => {
    const token = apiClient.getToken();
    if (token && socketRef.current) {
      socketRef.current.connect(token);
    }
  }, []);

  // Simulate disconnect (for testing)
  const simulateDisconnect = useCallback(() => {
    socketRef.current?.simulateDisconnect();
  }, []);

  return {
    connectionStatus,
    sendMessage,
    sendTyping,
    disconnect,
    reconnect,
    simulateDisconnect,
  };
}
