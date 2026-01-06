/**
 * SmartTask360 — Comment Reactions Display
 */

import { useState } from "react";
import { EmojiPicker } from "./EmojiPicker";
import { useCommentReactions, useToggleReaction } from "../hooks/useComments";

interface CommentReactionsProps {
  commentId: string;
  showAddButton?: boolean;
}

export function CommentReactions({ commentId, showAddButton = false }: CommentReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { data: reactions = [], isLoading } = useCommentReactions(commentId);
  const toggleReaction = useToggleReaction(commentId);

  const handleEmojiSelect = (emoji: string) => {
    toggleReaction.mutate(emoji);
  };

  const handleReactionClick = (emoji: string) => {
    toggleReaction.mutate(emoji);
  };

  if (isLoading) {
    return null;
  }

  // Return fragments so parent can control layout
  return (
    <>
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
            reaction.has_current_user
              ? "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
              : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
          }`}
          title={`${reaction.count} ${reaction.count === 1 ? "человек" : "человека"}`}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button - only show on hover or when picker is open */}
      {(showAddButton || showPicker) && (
        <div className="relative inline-flex">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Добавить реакцию"
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {showPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      )}
    </>
  );
}
