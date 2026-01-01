"use client";

import { User } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

interface OnlineUsersProps {
  users: User[];
  typingUserIds: string[];
  currentUserId: string;
  currentUser: User;
}

export function OnlineUsers({
  users,
  typingUserIds,
  currentUserId,
  currentUser,
}: OnlineUsersProps) {
  // Separate online and offline users
  const onlineUsers = users.filter(
    (user) => user.isOnline && user.id !== currentUserId
  );
  const offlineUsers = users.filter(
    (user) => !user.isOnline && user.id !== currentUserId
  );
  const totalOnline = onlineUsers.length + 1;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderUserItem = (
    user: User,
    index: number,
    isCurrent: boolean = false
  ) => {
    const isTyping = typingUserIds.includes(user.id);
    const isOnline = user.isOnline || isCurrent;

    return (
      <motion.div
        key={user.id}
        className={`user-item ${isCurrent ? "user-item--current" : ""}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <div className="user-item__avatar">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span
            className={`user-item__status-dot ${
              isTyping
                ? "user-item__status-dot--typing"
                : isOnline
                ? "user-item__status-dot--online"
                : "user-item__status-dot--offline"
            }`}
          />
        </div>
        <div className="user-item__info">
          <div className="user-item__name">
            {user.name}
            {isCurrent && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  opacity: 0.7,
                }}
              >
                (You)
              </span>
            )}
          </div>
          <div
            className={`user-item__status ${
              isTyping ? "user-item__status--typing" : ""
            }`}
          >
            {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <aside className="chat-sidebar">
      <div className="chat-sidebar-header">
        <h2 className="chat-sidebar-title">People</h2>
        <p className="chat-sidebar-count">
          {totalOnline} online • {users.length} total
        </p>
      </div>
      <ScrollArea className="user-list">
        {/* Current user first */}
        <div
          style={{
            marginBottom: "1rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {renderUserItem(currentUser, 0, true)}
        </div>

        {/* Other online users */}
        {onlineUsers.length > 0 && (
          <div style={{ marginBottom: offlineUsers.length > 0 ? "1rem" : "0" }}>
            {onlineUsers.map((user, index) => renderUserItem(user, index + 1))}
          </div>
        )}

        {/* Offline users */}
        {offlineUsers.length > 0 && (
          <div>
            <div
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "0.75rem",
                opacity: 0.5,
                fontWeight: 600,
              }}
            >
              OFFLINE
            </div>
            {offlineUsers.map((user, index) =>
              renderUserItem(user, onlineUsers.length + index + 1)
            )}
          </div>
        )}

        {/* Empty state - only show if no other users at all */}
        {onlineUsers.length === 0 && offlineUsers.length === 0 && (
          <div
            style={{
              padding: "2rem 1rem",
              textAlign: "center",
              opacity: 0.5,
              fontSize: "0.875rem",
            }}
          >
            No other users registered. Invite someone to chat!
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
