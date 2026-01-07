import { useState, useMemo } from "react";
import { Loading, EmptyState, EmptyStateIcons } from "../../../shared/ui";
import { useBoardColumnsWithTasks, useMoveTask } from "../hooks";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanFilters } from "./KanbanFilters";
import type { KanbanFilters as KanbanFiltersType, BoardTaskWithDetails, BoardColumnWithTasks } from "../types";

interface KanbanBoardProps {
  boardId: string;
}

// Filter tasks based on criteria
function filterTasks(
  tasks: BoardTaskWithDetails[],
  filters: KanbanFiltersType
): BoardTaskWithDetails[] {
  return tasks.filter((task) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!task.task_title.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Priority filter
    if (filters.priority && task.task_priority !== filters.priority) {
      return false;
    }

    // Assignee filter
    if (filters.assignee_id && task.task_assignee_id !== filters.assignee_id) {
      return false;
    }

    // Tags filter (task must have at least one of the selected tags)
    if (filters.tag_ids && filters.tag_ids.length > 0) {
      const taskTagIds = task.task_tags?.map((t) => t.id) || [];
      const hasMatchingTag = filters.tag_ids.some((tagId) =>
        taskTagIds.includes(tagId)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { data: columns, isLoading, error } = useBoardColumnsWithTasks(boardId);
  const moveTask = useMoveTask(boardId);

  const [filters, setFilters] = useState<KanbanFiltersType>({});
  const [dragState, setDragState] = useState<{
    taskId: string;
    sourceColumnId: string;
  } | null>(null);

  // Apply filters to columns
  const filteredColumns = useMemo((): BoardColumnWithTasks[] | undefined => {
    if (!columns) return undefined;

    const hasActiveFilters =
      filters.search ||
      filters.priority ||
      filters.assignee_id ||
      (filters.tag_ids && filters.tag_ids.length > 0);

    if (!hasActiveFilters) {
      return columns;
    }

    return columns.map((column) => ({
      ...column,
      tasks: filterTasks(column.tasks, filters),
    }));
  }, [columns, filters]);

  const handleDragStart = (taskId: string, sourceColumnId: string) => {
    setDragState({ taskId, sourceColumnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!dragState) return;

    const { taskId, sourceColumnId } = dragState;

    if (sourceColumnId !== targetColumnId) {
      // Find the target column to get position
      const targetColumn = columns?.find((c) => c.id === targetColumnId);
      const position = targetColumn?.tasks.length || 0;

      moveTask.mutate({
        taskId,
        data: {
          column_id: targetColumnId,
          position,
        },
      });
    }

    setDragState(null);
  };

  if (isLoading) {
    return <Loading message="Загрузка доски..." />;
  }

  if (error) {
    return (
      <EmptyState
        icon={EmptyStateIcons.folder}
        title="Ошибка загрузки"
        description="Не удалось загрузить данные доски."
      />
    );
  }

  if (!columns || columns.length === 0) {
    return (
      <EmptyState
        icon={EmptyStateIcons.folder}
        title="Нет колонок"
        description="На этой доске пока нет колонок."
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <KanbanFilters filters={filters} onFiltersChange={setFilters} />

      {/* Board columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(filteredColumns || columns)
          .sort((a, b) => a.order_index - b.order_index)
          .map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
      </div>
    </div>
  );
}
