/**
 * SmartTask360 — Project Kanban Tab
 * Displays inline kanban board for a project with status-based columns
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Spinner, EmptyState, Badge, Avatar } from "../../../shared/ui";
import { useProjectTasks } from "../hooks";
import { useChangeTaskStatus } from "../../tasks/hooks";
import { formatDate, getTaskUrgency } from "../../../shared/lib/utils";
import type { Task, TaskStatus } from "../../tasks/types";

interface ProjectBoardsTabProps {
  projectId: string;
}

// Status columns configuration for MVP (without Scrum statuses)
const STATUS_COLUMNS: { status: TaskStatus; name: string; color: string }[] = [
  { status: "new", name: "Новые", color: "#3B82F6" },
  { status: "assigned", name: "Назначено", color: "#8B5CF6" },
  { status: "in_progress", name: "В работе", color: "#F59E0B" },
  { status: "in_review", name: "На проверке", color: "#EC4899" },
  { status: "rework", name: "На доработке", color: "#F97316" },
  { status: "done", name: "Готово", color: "#10B981" },
];

interface KanbanTaskCardProps {
  task: Task;
  onDragStart: (taskId: string, status: TaskStatus) => void;
}

function KanbanTaskCard({ task, onDragStart }: KanbanTaskCardProps) {
  const urgency = task.due_date ? getTaskUrgency(task) : null;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id, task.status)}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab"
    >
      <Link to={`/tasks/${task.id}`} className="block">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-blue-600">
          {task.title}
        </h4>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Badge type="priority" value={task.priority} />
          </div>

          <div className="flex items-center gap-2">
            {task.due_date && (
              <span
                className={`text-xs flex items-center gap-1 ${
                  urgency?.colorClass || "text-gray-500"
                }`}
                title={urgency?.tooltip || undefined}
              >
                {urgency?.icon && <span>{urgency.icon}</span>}
                {formatDate(task.due_date)}
              </span>
            )}
            {task.assignee_id && <Avatar name="A" size="xs" />}
          </div>
        </div>
      </Link>
    </div>
  );
}

interface KanbanColumnProps {
  name: string;
  color: string;
  status: TaskStatus;
  tasks: Task[];
  onDragStart: (taskId: string, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetStatus: TaskStatus) => void;
}

function KanbanColumn({
  name,
  color,
  status,
  tasks,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div
      className="flex-shrink-0 w-72 bg-gray-100 rounded-lg"
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <span className="text-sm px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
        {tasks.map((task) => (
          <KanbanTaskCard key={task.id} task={task} onDragStart={onDragStart} />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Перетащите задачи сюда
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectBoardsTab({ projectId }: ProjectBoardsTabProps) {
  const { data: tasksData, isLoading, error } = useProjectTasks(projectId);
  const changeStatus = useChangeTaskStatus();

  const [dragState, setDragState] = useState<{
    taskId: string;
    sourceStatus: TaskStatus;
  } | null>(null);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>();

    // Initialize all columns
    for (const col of STATUS_COLUMNS) {
      grouped.set(col.status, []);
    }

    // Group tasks, filtering out cancelled and draft
    if (tasksData?.items) {
      for (const task of tasksData.items) {
        if (task.status === "cancelled" || task.status === "draft") continue;
        if (task.status === "on_hold") continue; // Skip on_hold for MVP

        const tasks = grouped.get(task.status);
        if (tasks) {
          tasks.push(task);
        }
      }
    }

    return grouped;
  }, [tasksData]);

  const handleDragStart = (taskId: string, sourceStatus: TaskStatus) => {
    setDragState({ taskId, sourceStatus });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: TaskStatus) => {
    if (!dragState) return;

    const { taskId, sourceStatus } = dragState;

    if (sourceStatus !== targetStatus) {
      changeStatus.mutate({
        taskId,
        data: { status: targetStatus },
      });
    }

    setDragState(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Ошибка загрузки задач
      </div>
    );
  }

  const totalTasks = tasksData?.items?.length || 0;

  if (totalTasks === 0) {
    return (
      <EmptyState
        title="Нет задач"
        description="Создайте задачи в проекте, чтобы увидеть их на канбан-доске"
      />
    );
  }

  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex gap-4 pb-4 min-w-max">
        {STATUS_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            name={col.name}
            color={col.color}
            status={col.status}
            tasks={tasksByStatus.get(col.status) || []}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
