/**
 * SmartTask360 — Project Tasks Tab
 * Displays list of tasks belonging to a project
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Spinner, Badge, EmptyState, Button } from "../../../shared/ui";
import { useProjectTasks } from "../hooks";
import { formatDate, getTaskUrgency } from "../../../shared/lib/utils";
import type { Task } from "../../tasks/types";
import { TaskFormModal } from "../../tasks/components/TaskFormModal";

interface ProjectTasksTabProps {
  projectId: string;
}

function TaskRowCompact({ task }: { task: Task }) {
  const isCompleted = task.status === "done";
  const urgency = getTaskUrgency({
    status: task.status,
    due_date: task.due_date,
    completed_at: task.completed_at,
  });

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
    >
      {/* Status indicator */}
      <div className="shrink-0">
        {isCompleted ? (
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            isCompleted ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {task.title}
        </span>
        {task.children_count > 0 && (
          <span className="text-xs text-gray-400 ml-2">
            ({task.children_count} подзадач)
          </span>
        )}
      </div>

      {/* Due date with urgency */}
      {task.due_date && (
        <div className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500">
          <span>{formatDate(task.due_date)}</span>
          {urgency.icon && (
            <span title={urgency.tooltip || undefined}>{urgency.icon}</span>
          )}
        </div>
      )}

      {/* Priority */}
      <div className="shrink-0">
        <Badge type="priority" value={task.priority} size="sm" />
      </div>

      {/* Status */}
      <div className="shrink-0">
        <Badge type="status" value={task.status} size="sm" />
      </div>

      {/* Arrow */}
      <svg
        className="h-4 w-4 text-gray-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 4.5l7.5 7.5-7.5 7.5"
        />
      </svg>
    </Link>
  );
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { data, isLoading, error } = useProjectTasks(projectId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const tasks = data?.items || [];

  if (tasks.length === 0) {
    return (
      <>
        <EmptyState
          title="Нет задач"
          description="В этом проекте пока нет задач"
          action={
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              Создать задачу
            </Button>
          }
        />
        <TaskFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultProjectId={projectId}
        />
      </>
    );
  }

  return (
    <div>
      {/* Header with create button */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Всего задач: {data?.total || 0}
        </span>
        <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
          + Создать задачу
        </Button>
      </div>

      {/* Task list */}
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <TaskRowCompact key={task.id} task={task} />
        ))}
      </div>

      {/* Footer with link to full list */}
      {(data?.total || 0) > tasks.length && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-center">
          <Link
            to={`/tasks?project_id=${projectId}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Показать все {data?.total} задач →
          </Link>
        </div>
      )}

      {/* Quick link to task list */}
      <div className="px-4 py-3 border-t border-gray-100 text-center">
        <Link
          to={`/tasks?project_id=${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Открыть полный список задач
        </Link>
      </div>

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultProjectId={projectId}
      />
    </div>
  );
}
