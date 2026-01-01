"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const emojiCategories = [
  {
    name: "Smileys",
    emojis: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👍",
      "👎",
      "👌",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👋",
      "🤚",
      "✋",
      "🖐️",
      "👏",
      "🙌",
      "🤝",
      "🙏",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❤️‍🔥",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "🎉",
      "🎊",
      "🎈",
      "🎁",
      "🏆",
      "🥇",
      "⭐",
      "🌟",
      "✨",
      "💡",
      "🔥",
      "💯",
      "✅",
      "❌",
      "⚡",
      "💬",
    ],
  },
  {
    name: "Nature",
    emojis: [
      "🌸",
      "🌺",
      "🌻",
      "🌹",
      "🌷",
      "🌼",
      "🌴",
      "🌲",
      "🍀",
      "🌈",
      "☀️",
      "🌙",
      "⭐",
      "❄️",
      "🔥",
      "💧",
    ],
  },
];

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onEmojiSelect(emoji);
      setIsOpen(false);
    },
    [onEmojiSelect]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-accent"
          aria-label="Open emoji picker"
        >
          <Smile size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="end"
        side="top"
        sideOffset={10}
      >
        <AnimatePresence>
          <motion.div
            className="emoji-picker"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {emojiCategories.map((category) => (
              <div key={category.name} className="emoji-picker-category">
                <div className="emoji-picker-category-title">
                  {category.name}
                </div>
                <div className="emoji-picker-grid">
                  {category.emojis.map((emoji, index) => (
                    <motion.button
                      key={`${category.name}-${index}`}
                      className="emoji-picker-emoji"
                      onClick={() => handleEmojiClick(emoji)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}
