import { useState } from "react";
import { Loading, EmptyState, EmptyStateIcons } from "../../../shared/ui";
import { useBoardColumnsWithTasks, useMoveTask } from "../hooks";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { data: columns, isLoading, error } = useBoardColumnsWithTasks(boardId);
  const moveTask = useMoveTask(boardId);

  const [dragState, setDragState] = useState<{
    taskId: string;
    sourceColumnId: string;
  } | null>(null);

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
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns
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
  );
}
