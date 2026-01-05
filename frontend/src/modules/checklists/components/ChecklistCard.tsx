/**
 * ChecklistCard — Single checklist with items
 */

import { useState } from "react";
import type { ChecklistWithItems } from "../types";
import { ChecklistItemRow } from "./ChecklistItemRow";

interface ChecklistCardProps {
  checklist: ChecklistWithItems;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  onToggleItem: (itemId: string, isCompleted: boolean) => void;
  onUpdateItem: (itemId: string, content: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (content: string) => void;
  disabled?: boolean;
}

export function ChecklistCard({
  checklist,
  onUpdateTitle,
  onDelete,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  disabled = false,
}: ChecklistCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(checklist.title);
  const [newItemValue, setNewItemValue] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate progress
  const totalItems = checklist.items.length;
  const completedItems = checklist.items.filter((i) => i.is_completed).length;
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const handleTitleSave = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== checklist.title) {
      onUpdateTitle(trimmed);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleValue(checklist.title);
      setIsEditingTitle(false);
    }
  };

  const handleAddItem = () => {
    const trimmed = newItemValue.trim();
    if (trimmed) {
      onAddItem(trimmed);
      setNewItemValue("");
    }
  };

  const handleAddItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-1">
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="flex-1 font-medium text-gray-800 border border-blue-400 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <h4
              onDoubleClick={() => !disabled && setIsEditingTitle(true)}
              className="font-medium text-gray-800 cursor-default"
            >
              {checklist.title}
            </h4>
          )}

          {/* Progress badge */}
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {completedItems}/{totalItems}
          </span>
        </div>

        {/* Delete checklist */}
        {!disabled && (
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Удалить чеклист"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Items */}
      {!isCollapsed && (
        <div className="p-2">
          {/* Items list */}
          <div className="space-y-0.5">
            {checklist.items
              .filter((item) => !item.parent_id) // Only root items for flat structure
              .sort((a, b) => a.position - b.position)
              .map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={onToggleItem}
                  onUpdate={onUpdateItem}
                  onDelete={onDeleteItem}
                  disabled={disabled}
                />
              ))}
          </div>

          {/* Add new item */}
          {!disabled && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={handleAddItemKeyDown}
                placeholder="Добавить пункт..."
                className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddItem}
                disabled={!newItemValue.trim()}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Добавить
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
