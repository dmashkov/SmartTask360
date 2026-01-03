import { Link } from "react-router-dom";
import { Badge, Avatar, Checkbox } from "../../../shared/ui";
import { formatDate, formatDateTime } from "../../../shared/lib/utils";
import type { Task } from "../types";

interface TaskRowProps {
  task: Task;
  onStatusToggle?: (task: Task) => void;
}

export function TaskRow({ task, onStatusToggle }: TaskRowProps) {
  const isCompleted = task.status === "done";
  const isOverdue = task.due_date && new Date(task.due_date + "Z") < new Date() && !isCompleted;

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
      {/* Checkbox */}
      <Checkbox
        checked={isCompleted}
        onChange={() => onStatusToggle?.(task)}
      />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/tasks/${task.id}`}
          className={`block font-medium hover:text-blue-600 truncate ${
            isCompleted ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {task.title}
        </Link>
        {task.depth > 0 && (
          <span className="text-xs text-gray-400">
            Подзадача (уровень {task.depth})
          </span>
        )}
      </div>

      {/* Due Date */}
      <div className="w-28 text-sm">
        {task.due_date ? (
          <span className={isOverdue ? "text-red-500 font-medium" : "text-gray-600"}>
            {formatDate(task.due_date)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>

      {/* Priority */}
      <div className="w-24">
        <Badge type="priority" value={task.priority} />
      </div>

      {/* Status */}
      <div className="w-28">
        <Badge type="status" value={task.status} />
      </div>

      {/* Created */}
      <div className="w-32 text-sm text-gray-500">
        {formatDateTime(task.created_at)}
      </div>

      {/* Assignee */}
      <div className="w-8">
        {task.assignee_id ? (
          <Avatar name="Assignee" size="sm" />
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="w-6">
        <Link
          to={`/tasks/${task.id}`}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
