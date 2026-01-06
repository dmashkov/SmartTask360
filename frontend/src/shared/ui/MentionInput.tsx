/**
 * SmartTask360 — MentionInput component
 * Textarea with @mention autocomplete support
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useUserSearch } from "../../modules/users/hooks/useUserSearch";
import type { User } from "../../modules/users/types";
import { cn } from "../lib/utils";
import { Avatar } from "./Avatar";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
  onSubmit?: () => void;
}

// Extract the mention query from cursor position
function getMentionQuery(value: string, cursorPos: number): { query: string; startPos: number } | null {
  // Find the last @ before cursor
  const beforeCursor = value.slice(0, cursorPos);
  const atIndex = beforeCursor.lastIndexOf("@");

  if (atIndex === -1) return null;

  // Check if @ is at start or after whitespace
  if (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1])) {
    return null;
  }

  // Get text after @
  const afterAt = beforeCursor.slice(atIndex + 1);

  // Check if there's a space that ends the mention (completed mention)
  // Allow spaces in the query for "Имя Фамилия" format
  // End mention if there are 2+ spaces or newline
  if (/\s{2,}|\n/.test(afterAt)) {
    return null;
  }

  return {
    query: afterAt,
    startPos: atIndex,
  };
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Введите текст...",
  className,
  disabled = false,
  rows = 3,
  onSubmit,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState<{ query: string; startPos: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const { data: users = [], isLoading } = useUserSearch(
    mentionQuery?.query || "",
    !!mentionQuery && mentionQuery.query.length >= 1
  );

  // Handle cursor position changes
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const query = getMentionQuery(value, textarea.selectionStart);
    setMentionQuery(query);
    setSelectedIndex(0);

    // Calculate dropdown position
    if (query) {
      // Create a temporary span to measure text before @
      const textBefore = value.slice(0, query.startPos);
      const lines = textBefore.split("\n");
      const lineHeight = 24; // Approximate line height
      const charWidth = 8; // Approximate char width for monospace

      const currentLineIndex = lines.length - 1;
      const currentLine = lines[currentLineIndex];

      setDropdownPosition({
        top: (currentLineIndex + 1) * lineHeight + 4,
        left: Math.min(currentLine.length * charWidth, 200),
      });
    }
  }, [value]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Insert mention into text
  const insertMention = (user: User) => {
    if (!mentionQuery) return;

    const before = value.slice(0, mentionQuery.startPos);
    const after = value.slice(textareaRef.current?.selectionStart || mentionQuery.startPos + mentionQuery.query.length + 1);

    // Insert @Name with a space after
    const newValue = `${before}@${user.name} ${after}`;
    onChange(newValue);

    // Move cursor after the mention
    setTimeout(() => {
      const newCursorPos = mentionQuery.startPos + user.name.length + 2; // +2 for @ and space
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current?.focus();
    }, 0);

    setMentionQuery(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionQuery || users.length === 0) {
      // Ctrl+Enter to submit
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        insertMention(users[selectedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setMentionQuery(null);
        break;
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMentionQuery(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update mention query on cursor position change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const events = ["keyup", "click", "select"];
    events.forEach((event) => textarea.addEventListener(event, handleSelectionChange));
    return () => {
      events.forEach((event) => textarea.removeEventListener(event, handleSelectionChange));
    };
  }, [handleSelectionChange]);

  const showDropdown = mentionQuery && (users.length > 0 || isLoading);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "resize-none",
          className
        )}
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: "200px",
          }}
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Поиск...</div>
          ) : (
            users.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  "w-full px-3 py-2 flex items-center gap-2 text-left text-sm",
                  "hover:bg-gray-100",
                  index === selectedIndex && "bg-blue-50"
                )}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar name={user.name} size="sm" />
                <div>
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {mentionQuery && (
        <div className="text-xs text-gray-400 mt-1">
          Введите имя для упоминания, Enter для выбора
        </div>
      )}
    </div>
  );
}
