"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  connect,
  disconnect,
  join,
  leave,
  sendMessage as socketSendMessage,
  sendTyping as socketSendTyping,
  on,
  off,
  simulateDisconnect as socketSimulateDisconnect,
} from "@/lib/socket";
import { Message, User, TypingUser } from "@/types/chat";
import { getToken } from "@/lib/api";

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

    const token = getToken();
    if (!token) {
      return;
    }

    // connect with JWT token
    connect(token);

    // define event handlers that use refs
    const handleConnect = () => {
      setConnectionStatus("connected");
      onConnectionChangeRef.current?.("connected");

      // send queued messages after reconnection
      messageQueueRef.current.forEach((msg) => {
        socketSendMessage({
          content: msg,
          senderId: currentUser.id,
          senderName: currentUser.name,
        });
      });
      messageQueueRef.current = [];

      // join the chat with authenticated user
      join(currentUser);
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

    // set up event listeners
    on("connect", handleConnect);
    on("disconnect", handleDisconnect);
    on("reconnecting", handleReconnecting);
    on("message", handleMessage);
    on("messageConfirmed", handleMessageConfirmed);
    on("userTyping", handleUserTyping);
    on("userStoppedTyping", handleUserStoppedTyping);
    on("userJoined", handleUserJoined);
    on("userLeft", handleUserLeft);
    on("userList", handleUserList);

    // cleanup - remove all event listeners
    return () => {
      off("connect", handleConnect);
      off("disconnect", handleDisconnect);
      off("reconnecting", handleReconnecting);
      off("message", handleMessage);
      off("messageConfirmed", handleMessageConfirmed);
      off("userTyping", handleUserTyping);
      off("userStoppedTyping", handleUserStoppedTyping);
      off("userJoined", handleUserJoined);
      off("userLeft", handleUserLeft);
      off("userList", handleUserList);

      leave();
      disconnect();
    };
  }, [currentUser]);

  // handle send message
  const sendMessage = useCallback(
    (content: string): string => {
      const messageId = uuidv4();

      if (
        connectionStatus === "connected" &&
        currentUser
      ) {
        socketSendMessage({
          id: messageId,
          content,
          senderId: currentUser.id,
          senderName: currentUser.name,
        });
      } else {
        // queue message for later
        messageQueueRef.current.push(content);
      }

      return messageId;
    },
    [connectionStatus, currentUser]
  );

  // send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    socketSendTyping(isTyping);
  }, []);

  // disconnect
  const disconnectCb = useCallback(() => {
    disconnect();
  }, []);

  // reconnect
  const reconnectCb = useCallback(() => {
    const token = getToken();
    if (token) {
      connect(token);
    }
  }, []);

  // simulate disconnect (for testing)
  const simulateDisconnect = useCallback(() => {
    socketSimulateDisconnect();
  }, []);

  return {
    connectionStatus,
    sendMessage,
    sendTyping,
    disconnect: disconnectCb,
    reconnect: reconnectCb,
    simulateDisconnect,
  };
}
