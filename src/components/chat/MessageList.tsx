"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Message, TypingUser } from "@/types/chat";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "@/components/ui/button";
import { ChevronUp, ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingUsers: TypingUser[];
  isLoading: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => void;
}

// Helper to determine if messages should be grouped
const shouldGroupMessages = (
  currentMessage: Message,
  previousMessage: Message | null,
  nextMessage: Message | null
): { showHeader: boolean; isFirstInGroup: boolean; isLastInGroup: boolean } => {
  const timeThreshold = 5 * 60 * 1000; // 5 minutes

  const isSameSenderAsPrev =
    previousMessage && previousMessage.senderId === currentMessage.senderId;
  const isSameSenderAsNext =
    nextMessage && nextMessage.senderId === currentMessage.senderId;

  const isWithinTimeOfPrev =
    previousMessage &&
    new Date(currentMessage.timestamp).getTime() -
      new Date(previousMessage.timestamp).getTime() <
      timeThreshold;
  const isWithinTimeOfNext =
    nextMessage &&
    new Date(nextMessage.timestamp).getTime() -
      new Date(currentMessage.timestamp).getTime() <
      timeThreshold;

  const isFirstInGroup = !isSameSenderAsPrev || !isWithinTimeOfPrev;
  const isLastInGroup = !isSameSenderAsNext || !isWithinTimeOfNext;

  return {
    showHeader: isFirstInGroup,
    isFirstInGroup,
    isLastInGroup,
  };
};

export function MessageList({
  messages,
  currentUserId,
  typingUsers,
  isLoading,
  hasMoreMessages,
  onLoadMore,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const prevMessageCountRef = useRef(messages.length);

  // Sort messages by timestamp
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages]);

  // Scroll to bottom when new messages arrive (if auto-scroll is enabled)
  useEffect(() => {
    if (shouldAutoScroll && messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, shouldAutoScroll]);

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;

    setShowScrollToBottom(!isNearBottom);
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShouldAutoScroll(true);
  }, []);

  return (
    <div className="message-area">
      <div
        ref={scrollContainerRef}
        className="message-list"
        onScroll={handleScroll}
      >
        {/* Load more button */}
        {hasMoreMessages && (
          <motion.div
            className="message-list__load-more"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <div
                  className="loading-spinner"
                  style={{ width: 16, height: 16 }}
                />
              ) : (
                <ChevronUp size={16} />
              )}
              {isLoading ? "Loading..." : "Load earlier messages"}
            </Button>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence mode="popLayout">
          {sortedMessages.map((message, index) => {
            const prevMessage = sortedMessages[index - 1] || null;
            const nextMessage = sortedMessages[index + 1] || null;
            const groupInfo = shouldGroupMessages(
              message,
              prevMessage,
              nextMessage
            );

            return (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                showHeader={groupInfo.showHeader}
                isFirstInGroup={groupInfo.isFirstInGroup}
                isLastInGroup={groupInfo.isLastInGroup}
              />
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <TypingIndicator typingUsers={typingUsers} />
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: 100,
              right: 24,
              zIndex: 10,
            }}
          >
            <Button
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
            >
              <ArrowDown size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
