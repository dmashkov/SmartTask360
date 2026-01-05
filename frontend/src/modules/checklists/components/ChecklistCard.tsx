/**
 * ChecklistCard — Single checklist with items and drag-n-drop reordering
 */

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  onMoveItem?: (itemId: string, oldIndex: number, newIndex: number) => void;
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
  onMoveItem,
  disabled = false,
}: ChecklistCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(checklist.title);
  const [newItemValue, setNewItemValue] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sorted items for display and DnD
  const sortedItems = useMemo(() => {
    return checklist.items
      .filter((item) => !item.parent_id) // Only root items for flat structure
      .sort((a, b) => a.position - b.position);
  }, [checklist.items]);

  const itemIds = useMemo(() => sortedItems.map((item) => item.id), [sortedItems]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onMoveItem) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Pass both old and new indices for optimistic update
        onMoveItem(active.id as string, oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header - ultra compact */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
        <div className="flex items-center gap-1 flex-1">
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
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
              className="flex-1 text-xs font-medium text-gray-800 border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <span
              onDoubleClick={() => !disabled && setIsEditingTitle(true)}
              className="text-xs font-medium text-gray-800 cursor-default"
            >
              {checklist.title}
            </span>
          )}

          {/* Progress badge */}
          <span className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
            {completedItems}/{totalItems}
          </span>
        </div>

        {/* Delete checklist */}
        {!disabled && (
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Удалить чеклист"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Items - ultra compact */}
      {!isCollapsed && (
        <div className="px-1 py-0.5">
          {/* Items list with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
              <div>
                {sortedItems.map((item) => (
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
            </SortableContext>
          </DndContext>

          {/* Add new item - ultra compact */}
          {!disabled && (
            <div className="mt-0.5 flex items-center gap-1 px-0.5">
              <input
                type="text"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                onKeyDown={handleAddItemKeyDown}
                placeholder="+ добавить..."
                className="flex-1 text-xs border-0 border-b border-gray-200 px-1 py-0.5 focus:outline-none focus:border-blue-500 bg-transparent"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
