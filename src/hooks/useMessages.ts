"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { apiClient } from "@/lib/api";
import { MessageQueue, QueuedMessage } from "@/lib/messageQueue";

const MESSAGES_QUERY_KEY = ["messages"];
const PAGE_SIZE = 10;

interface UseMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
  loadMoreMessages: () => Promise<Message[]>;
  hasMoreMessages: boolean;
}

// Optimistic update helper
export function optimisticAddMessage(
  queryClient: QueryClient,
  message: Message
) {
  queryClient.setQueryData<Message[]>(MESSAGES_QUERY_KEY, (old = []) => [
    ...old,
    message,
  ]);
}

// Update message status helper
export function updateMessageStatusInCache(
  queryClient: QueryClient,
  messageId: string,
  status: Message["status"]
) {
  queryClient.setQueryData<Message[]>(MESSAGES_QUERY_KEY, (old = []) =>
    old.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
  );
}

export function useMessages(): UseMessagesReturn {
  const queryClient = useQueryClient();
  const messageQueueRef = useRef<MessageQueue | null>(null);

  // Initialize message queue
  useEffect(() => {
    const handleFlush = async (messages: QueuedMessage[]) => {
      try {
        await apiClient.batchInsertMessages(messages);
      } catch (error) {
        console.error("Failed to batch insert messages:", error);
      }
    };

    messageQueueRef.current = new MessageQueue(handleFlush);

    return () => {
      messageQueueRef.current?.clear();
    };
  }, []);

  // Fetch initial messages from API
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery<Message[], Error>({
    queryKey: MESSAGES_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.getMessages(PAGE_SIZE);
      return response.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    },
    staleTime: Infinity, // Messages don't go stale
    refetchOnWindowFocus: false,
  });

  // Add a new message optimistically and queue for batch insert
  const addMessage = useCallback(
    (message: Message) => {
      // Check if message already exists to avoid duplicates
      const currentMessages =
        queryClient.getQueryData<Message[]>(MESSAGES_QUERY_KEY) || [];
      const exists = currentMessages.some((m) => m.id === message.id);

      if (!exists) {
        // Add to UI immediately
        optimisticAddMessage(queryClient, message);

        // Queue for batch insert
        messageQueueRef.current?.queueMessage({
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          timestamp: message.timestamp,
          status: message.status,
        });
      }
    },
    [queryClient]
  );

  // Update message status in cache
  const updateMessageStatus = useCallback(
    (messageId: string, status: Message["status"]) => {
      updateMessageStatusInCache(queryClient, messageId, status);
    },
    [queryClient]
  );

  // Load more messages (pagination from API)
  const loadMoreMessages = useCallback(async (): Promise<Message[]> => {
    const currentMessages =
      queryClient.getQueryData<Message[]>(MESSAGES_QUERY_KEY) || [];

    if (currentMessages.length === 0) {
      return [];
    }

    // Get oldest message timestamp
    const oldestTimestamp = currentMessages[0]?.timestamp;

    // Load older messages from API
    const response = await apiClient.getMessages(
      PAGE_SIZE,
      oldestTimestamp.toISOString()
    );
    const olderMessages = response.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));

    if (olderMessages.length > 0) {
      // Prepend older messages to the beginning
      queryClient.setQueryData<Message[]>(MESSAGES_QUERY_KEY, (old = []) => [
        ...olderMessages,
        ...old,
      ]);
    }

    return olderMessages;
  }, [queryClient]);

  // Check if there are more messages to load
  const hasMoreMessages = messages.length >= PAGE_SIZE;

  return {
    messages,
    isLoading,
    error: error || null,
    addMessage,
    updateMessageStatus,
    loadMoreMessages,
    hasMoreMessages,
  };
}

// Hook for sending messages with optimistic updates
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMessage: Message) => {
      // Message will be queued by addMessage
      return newMessage;
    },
    onMutate: async (newMessage) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: MESSAGES_QUERY_KEY });

      // Snapshot the previous value
      const previousMessages =
        queryClient.getQueryData<Message[]>(MESSAGES_QUERY_KEY);

      // Optimistically update to the new value
      optimisticAddMessage(queryClient, newMessage);

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (_err, _newMessage, context) => {
      // Roll back to the previous value on error
      if (context?.previousMessages) {
        queryClient.setQueryData(MESSAGES_QUERY_KEY, context.previousMessages);
      }
    },
  });
}
