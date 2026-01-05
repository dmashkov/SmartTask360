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
  useMoveChecklistItem,
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
  const moveItem = useMoveChecklistItem(taskId);

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
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Добавить чеклист
      </button>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header - only show if has checklists */}
      {hasChecklists && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700">Чеклисты</span>
            {data && data.total_items > 0 && (
              <span className="text-[10px] text-gray-500">
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
              className="text-[10px] text-blue-600 hover:text-blue-700"
            >
              + добавить
            </button>
          )}
        </div>
      )}

      {/* Add new checklist form - ultra compact */}
      {isAddingChecklist && (
        <div className="bg-gray-50 border border-gray-200 rounded p-1.5">
          <input
            type="text"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Название чеклиста..."
            autoFocus
            className="w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-1 flex gap-1">
            <button
              onClick={handleAddChecklist}
              disabled={!newChecklistTitle.trim() || createChecklist.isPending}
              className="px-2 py-0.5 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createChecklist.isPending ? "..." : "Создать"}
            </button>
            <button
              onClick={() => {
                setNewChecklistTitle("");
                setIsAddingChecklist(false);
              }}
              className="px-2 py-0.5 text-[10px] text-gray-600 hover:bg-gray-200 rounded transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Checklists - ultra compact spacing */}
      {hasChecklists && (
        <div className="space-y-1">
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
                onMoveItem={(itemId, oldIndex, newIndex) =>
                  moveItem.mutate({
                    itemId,
                    data: { new_position: newIndex },
                    checklistId: checklist.id,
                    oldIndex,
                    newIndex,
                  })
                }
              />
            ))}
        </div>
      )}
    </div>
  );
}
