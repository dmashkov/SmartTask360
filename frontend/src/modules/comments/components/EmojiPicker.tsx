/**
 * SmartTask360 — Emoji Picker for Comment Reactions
 */

import { useRef, useEffect } from "react";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = ["👍", "👎", "🤝", "👀", "❤️", "🙏", "😠", "😞"];

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 z-10"
    >
      <div className="flex items-center gap-2.5">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSelect(emoji)}
            className="w-7 h-7 flex items-center justify-center text-base hover:bg-gray-100 rounded transition-colors"
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
