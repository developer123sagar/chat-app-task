"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Menu, X, LogOut } from "lucide-react";
import { Message, User, TypingUser } from "@/types/chat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { OnlineUsers } from "./OnlineUsers";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";

export function ChatContainer() {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // message hook
  const {
    messages,
    isLoading: isLoadingMessages,
    addMessage,
    updateMessageStatus,
    loadMoreMessages,
    hasMoreMessages,
  } = useMessages();

  // web socket hook
  const { connectionStatus, sendMessage, sendTyping } = useWebSocket({
    currentUser,
    onMessage: useCallback(
      (message: Message) => {
        addMessage(message);
      },
      [addMessage]
    ),
    onMessageConfirmed: useCallback(
      (messageId: string) => {
        updateMessageStatus(messageId, "sent");
      },
      [updateMessageStatus]
    ),
    onUserTyping: useCallback(
      (user: TypingUser) => {
        setTypingUsers((prev) => {
          // don't show typing for current user
          if (user.userId === currentUser?.id) return prev;

          if (prev.some((u) => u.userId === user.userId)) {
            return prev;
          }
          return [...prev, user];
        });
      },
      [currentUser?.id]
    ),
    onUserStoppedTyping: useCallback((userId: string) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    }, []),
    onUserList: useCallback((userList: User[]) => {
      setUsers(userList);
    }, []),
    onUserJoined: useCallback(
      (user: User) => {
        // don't add current user to the list
        if (user.id === currentUser?.id) return;

        setUsers((prev) => {
          if (prev.some((u) => u.id === user.id)) {
            return prev.map((u) => (u.id === user.id ? user : u));
          }
          return [...prev, user];
        });
      },
      [currentUser?.id]
    ),
    onUserLeft: useCallback((userId: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }, []),
  });

  // handle sending message
  const handleSendMessage = useCallback(
    (content: string) => {
      const messageId = sendMessage(content);

      const payload: Message = {
        id: messageId,
        content,
        senderId: currentUser?.id,
        senderName: currentUser?.name,
        senderAvatar: currentUser?.avatar,
        timestamp: new Date(),
        status: "sending",
      };

      addMessage(payload);
    },
    [sendMessage, addMessage, currentUser]
  );

  // handle typing
  const handleTyping = useCallback(
    (isTyping: boolean) => {
      sendTyping(isTyping);
    },
    [sendTyping]
  );

  // handle load more
  const handleLoadMore = useCallback(async () => {
    await loadMoreMessages();
  }, [loadMoreMessages]);

  // handle logout
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  // get typing user IDs for sidebar
  const typingUserIds = typingUsers.map((u) => u.userId);

  // if no authenticated user, don't render
  if (!currentUser) return <></>;

  return (
    <div className="chat-container">
      {/* header part */}
      <header className="chat-header">
        <div className="chat-header__title">
          {/* mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="chat-header__mobile-toggle"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>

          <div className="chat-header__logo">
            <MessageCircle size={18} />
          </div>
          <span>ChatSpace</span>
        </div>

        <div className="chat-header__actions">
          {/* logout button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* sidebar - online users */}
      <motion.div
        initial={false}
        animate={{
          x: isMobileSidebarOpen ? 0 : undefined,
        }}
        className={`chat-sidebar ${
          isMobileSidebarOpen ? "chat-sidebar--mobile-open" : ""
        }`}
      >
        <OnlineUsers
          users={users}
          typingUserIds={typingUserIds}
          currentUserId={currentUser.id}
          currentUser={currentUser}
        />
      </motion.div>

      {/* message area */}
      <div className="message-area" style={{ position: "relative" }}>
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
          typingUsers={typingUsers}
          isLoading={isLoadingMessages}
          hasMoreMessages={hasMoreMessages}
          onLoadMore={handleLoadMore}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={connectionStatus !== "connected"}
        />
      </div>

      {/* mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 99,
          }}
        />
      )}
    </div>
  );
}
