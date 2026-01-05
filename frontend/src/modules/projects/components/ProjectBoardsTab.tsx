/**
 * SmartTask360 — Project Kanban Tab
 * Displays inline kanban board for a project with status-based columns
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Spinner, EmptyState, Badge, Avatar } from "../../../shared/ui";
import { useProjectTasks } from "../hooks";
import { useChangeTaskStatus, useCreateTask } from "../../tasks/hooks";
import { formatDate, getTaskUrgency } from "../../../shared/lib/utils";
import type { Task, TaskStatus } from "../../tasks/types";
import { useAuth } from "../../auth";

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
  projectId: string;
  onDragStart: (taskId: string, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetStatus: TaskStatus) => void;
}

function KanbanColumn({
  name,
  color,
  status,
  tasks,
  projectId,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const createTask = useCreateTask();
  const { user } = useAuth();

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      // Only assign to current user if status is not "new"
      const taskData: any = {
        title: newTaskTitle.trim(),
        status,
        priority: "medium",
        project_id: projectId,
      };

      // Assign to current user for all statuses except "new"
      if (status !== "new" && user?.id) {
        taskData.assignee_id = user.id;
      }

      await createTask.mutateAsync(taskData);
      setNewTaskTitle("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateTask();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewTaskTitle("");
    }
  };

  return (
    <div
      className="flex-1 bg-gray-100 rounded-lg"
      style={{ minWidth: "170px" }}
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
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
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Добавить задачу"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Column Body */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-350px)] overflow-y-auto">
        {/* Quick create form */}
        {isCreating && (
          <div className="bg-white rounded-lg border-2 border-blue-400 p-3 shadow-sm">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newTaskTitle.trim()) {
                  setIsCreating(false);
                }
              }}
              placeholder="Название задачи..."
              className="w-full text-sm border-none outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim() || createTask.isPending}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewTaskTitle("");
                }}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {tasks.map((task) => (
          <KanbanTaskCard key={task.id} task={task} onDragStart={onDragStart} />
        ))}

        {tasks.length === 0 && !isCreating && (
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
      <div className="flex gap-4 pb-4">
        {STATUS_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            name={col.name}
            color={col.color}
            status={col.status}
            tasks={tasksByStatus.get(col.status) || []}
            projectId={projectId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
