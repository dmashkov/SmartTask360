/**
 * SmartTask360 — Tags multi-select component
 * Allows selecting multiple tags with create-on-the-fly capability
 */

import { useState, useRef, useEffect } from "react";
import { useTags, useCreateTag } from "../hooks/useTags";
import { TagBadge } from "./TagBadge";

interface TagsSelectProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Predefined colors for new tags
const TAG_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function TagsSelect({
  value,
  onChange,
  placeholder = "Выберите теги...",
  disabled = false,
  className = "",
}: TagsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter tags by search
  const filteredTags = tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(search.toLowerCase()) &&
      !value.includes(tag.id)
  );

  // Selected tags objects
  const selectedTags = tags.filter((tag) => value.includes(tag.id));

  // Check if search matches any existing tag exactly
  const exactMatch = tags.some(
    (tag) => tag.name.toLowerCase() === search.toLowerCase()
  );

  const handleToggleTag = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!search.trim() || exactMatch) return;

    try {
      // Pick a random color
      const randomColor = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
      const newTag = await createTag.mutateAsync({
        name: search.trim(),
        color: randomColor,
      });

      // Add new tag to selection
      onChange([...value, newTag.id]);
      setSearch("");
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search.trim() && !exactMatch) {
      e.preventDefault();
      handleCreateTag();
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected tags + input */}
      <div
        className={`min-h-[38px] w-full px-2 py-1.5 border rounded-md bg-white flex flex-wrap gap-1 items-center cursor-text ${
          isOpen ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300"
        } ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            size="xs"
            onRemove={disabled ? undefined : () => handleRemoveTag(tag.id)}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
          disabled={disabled}
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Загрузка...</div>
          ) : (
            <>
              {/* Existing tags */}
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}

              {/* Create new tag option */}
              {search.trim() && !exactMatch && (
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={createTag.isPending}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2 border-t"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {createTag.isPending ? "Создание..." : `Создать "${search.trim()}"`}
                </button>
              )}

              {/* Empty state */}
              {filteredTags.length === 0 && !search.trim() && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {tags.length === 0 ? "Нет тегов" : "Все теги выбраны"}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
