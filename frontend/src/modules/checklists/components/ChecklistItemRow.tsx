/**
 * ChecklistItemRow — Single checklist item with checkbox and drag handle
 */

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ChecklistItem } from "../types";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: (itemId: string, isCompleted: boolean) => void;
  onUpdate: (itemId: string, content: string) => void;
  onDelete: (itemId: string) => void;
  disabled?: boolean;
}

export function ChecklistItemRow({
  item,
  onToggle,
  onUpdate,
  onDelete,
  disabled = false,
}: ChecklistItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.content);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = () => {
    if (!disabled) {
      onToggle(item.id, !item.is_completed);
    }
  };

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setEditValue(item.content);
    }
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.content) {
      onUpdate(item.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(item.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 py-0.5 px-1 rounded hover:bg-gray-50 ${
        item.is_completed ? "opacity-60" : ""
      } ${isDragging ? "opacity-50 bg-blue-50 shadow-lg z-10" : ""}`}
    >
      {/* Drag handle */}
      {!disabled && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
          title="Перетащить"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </button>
      )}

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`flex-shrink-0 w-3 h-3 rounded border flex items-center justify-center transition-colors ${
          item.is_completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-green-400"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        {item.is_completed && (
          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 text-xs border border-blue-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={`flex-1 text-xs cursor-default select-none ${
            item.is_completed ? "line-through text-gray-500" : "text-gray-700"
          }`}
        >
          {item.content}
        </span>
      )}

      {/* Delete button */}
      {!disabled && (
        <button
          onClick={() => onDelete(item.id)}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-opacity"
          title="Удалить"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
