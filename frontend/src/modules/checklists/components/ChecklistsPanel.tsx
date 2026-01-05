/**
 * ChecklistsPanel — Panel showing all checklists for a task
 */

import { useState } from "react";
import { ChecklistCard } from "./ChecklistCard";
import {
  useTaskChecklists,
  useCreateChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useCreateChecklistItem,
  useToggleChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from "../hooks";

interface ChecklistsPanelProps {
  taskId: string;
  disabled?: boolean;
}

export function ChecklistsPanel({ taskId, disabled = false }: ChecklistsPanelProps) {
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  // Queries
  const { data, isLoading, error } = useTaskChecklists(taskId);

  // Checklist mutations
  const createChecklist = useCreateChecklist();
  const updateChecklist = useUpdateChecklist(taskId);
  const deleteChecklist = useDeleteChecklist(taskId);

  // Item mutations
  const createItem = useCreateChecklistItem(taskId);
  const toggleItem = useToggleChecklistItem(taskId);
  const updateItem = useUpdateChecklistItem(taskId);
  const deleteItem = useDeleteChecklistItem(taskId);

  const handleAddChecklist = () => {
    const trimmed = newChecklistTitle.trim();
    if (trimmed) {
      createChecklist.mutate(
        { task_id: taskId, title: trimmed },
        {
          onSuccess: () => {
            setNewChecklistTitle("");
            setIsAddingChecklist(false);
          },
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddChecklist();
    } else if (e.key === "Escape") {
      setNewChecklistTitle("");
      setIsAddingChecklist(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin inline-block w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full" />
        <span className="ml-2">Загрузка чеклистов...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Ошибка загрузки чеклистов
      </div>
    );
  }

  const checklists = data?.checklists ?? [];
  const hasChecklists = checklists.length > 0;

  // Generate default title for new checklist
  const getDefaultTitle = () => `Чек-лист ${checklists.length + 1}`;

  // Don't render anything if no checklists and not adding
  if (!hasChecklists && !isAddingChecklist) {
    if (disabled) return null;

    return (
      <button
        onClick={() => {
          setNewChecklistTitle(getDefaultTitle());
          setIsAddingChecklist(true);
        }}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Добавить чеклист
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header - only show if has checklists */}
      {hasChecklists && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Чеклисты</span>
            {data && data.total_items > 0 && (
              <span className="text-xs text-gray-500">
                {data.completed_items}/{data.total_items}
              </span>
            )}
          </div>
          {!disabled && !isAddingChecklist && (
            <button
              onClick={() => {
                setNewChecklistTitle(getDefaultTitle());
                setIsAddingChecklist(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              + Добавить
            </button>
          )}
        </div>
      )}

      {/* Add new checklist form */}
      {isAddingChecklist && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <input
            type="text"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Название чеклиста..."
            autoFocus
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleAddChecklist}
              disabled={!newChecklistTitle.trim() || createChecklist.isPending}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createChecklist.isPending ? "..." : "Создать"}
            </button>
            <button
              onClick={() => {
                setNewChecklistTitle("");
                setIsAddingChecklist(false);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Checklists */}
      {hasChecklists && (
        <div className="space-y-2">
          {checklists
            .sort((a, b) => a.position - b.position)
            .map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                disabled={disabled}
                onUpdateTitle={(title) =>
                  updateChecklist.mutate({ checklistId: checklist.id, data: { title } })
                }
                onDelete={() => deleteChecklist.mutate(checklist.id)}
                onToggleItem={(itemId, isCompleted) =>
                  toggleItem.mutate({ itemId, data: { is_completed: isCompleted } })
                }
                onUpdateItem={(itemId, content) =>
                  updateItem.mutate({ itemId, data: { content } })
                }
                onDeleteItem={(itemId) => deleteItem.mutate(itemId)}
                onAddItem={(content) =>
                  createItem.mutate({ checklist_id: checklist.id, content })
                }
              />
            ))}
        </div>
      )}
    </div>
  );
}
