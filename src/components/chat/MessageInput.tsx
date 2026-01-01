"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./EmojiPicker";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onTyping,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // handle typing indicator
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // set timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 2000);
  }, [isTyping, onTyping]);

  // clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setIsTyping(false);
      onTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [message, disabled, onSendMessage, onTyping]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      if (e.target.value.trim()) {
        handleTyping();
      }
    },
    [handleTyping]
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage((prev) => prev + emoji);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="message-input-container">
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Type a message..."
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <div className="message-input-actions">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <AnimatePresence>
            {message.trim() && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleSend}
                  disabled={disabled}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
