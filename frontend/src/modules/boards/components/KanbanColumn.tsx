import { KanbanCard } from "./KanbanCard";
import type { BoardColumnWithTasks } from "../types";

interface KanbanColumnProps {
  column: BoardColumnWithTasks;
  onDragStart: (taskId: string, sourceColumnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetColumnId: string) => void;
}

export function KanbanColumn({
  column,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  const taskCount = column.tasks.length;
  const hasWipLimit = column.wip_limit > 0;
  const isAtLimit = hasWipLimit && taskCount >= column.wip_limit;

  return (
    <div
      className="flex-shrink-0 w-72 bg-gray-100 rounded-lg"
      onDragOver={onDragOver}
      onDrop={() => onDrop(column.id)}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {column.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
            )}
            <h3 className="font-semibold text-gray-900">{column.name}</h3>
            <span className={`text-sm px-1.5 py-0.5 rounded ${
              isAtLimit ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"
            }`}>
              {taskCount}
              {hasWipLimit && `/${column.wip_limit}`}
            </span>
          </div>
        </div>
      </div>

      {/* Column Body */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        {column.tasks.map((boardTask) => (
          <div
            key={boardTask.id}
            draggable
            onDragStart={() => onDragStart(boardTask.task_id, column.id)}
          >
            <KanbanCard boardTask={boardTask} />
          </div>
        ))}

        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Перетащите задачи сюда
          </div>
        )}
      </div>
    </div>
  );
}
