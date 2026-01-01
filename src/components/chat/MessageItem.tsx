"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import { Message } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck, Clock } from "lucide-react";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showHeader: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageItem({
  message,
  isOwn,
  showHeader,
  isFirstInGroup,
  isLastInGroup,
}: MessageItemProps) {
  const formattedTime = useMemo(() => {
    const date = new Date(message.timestamp);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, h:mm a");
  }, [message.timestamp]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case "sending":
        return <Clock size={12} className="message-bubble__status--sending" />;
      case "sent":
        return <Check size={12} className="message-bubble__status--sent" />;
      case "delivered":
        return (
          <CheckCheck size={12} className="message-bubble__status--delivered" />
        );
      case "read":
        return (
          <CheckCheck size={12} className="message-bubble__status--read" />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`message-group ${
        isOwn ? "message-group-own" : "message-group--other"
      }`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {showHeader && !isOwn && (
        <div className="message-group-header">
          <Avatar className="h-6 w-6">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback className="text-[10px]">
              {getInitials(message.senderName)}
            </AvatarFallback>
          </Avatar>
          <span className="message-group__sender">{message.senderName}</span>
        </div>
      )}

      <div className="message-item">
        {!isOwn && isLastInGroup && (
          <Avatar
            className="h-8 w-8"
            style={{ visibility: isLastInGroup ? "visible" : "hidden" }}
          >
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback className="text-[10px]">
              {getInitials(message.senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        {!isOwn && !isLastInGroup && <div style={{ width: 32 }} />}

        <div className="message-bubble">
          <div className="message-bubble__content">{message.content}</div>
          <div className="message-bubble__meta">
            <span className="message-bubble-time">{formattedTime}</span>
            {isOwn && (
              <span className="message-bubble__status">{getStatusIcon()}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
