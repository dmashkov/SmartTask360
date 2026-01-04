import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../../shared/ui";
import { useTaskChildren } from "../hooks/useTasks";
import type { Task } from "../types";
import { cn, getTaskUrgency } from "../../../shared/lib/utils";

interface ChildTaskNodeProps {
  task: Task;
  depth?: number;
}

export function ChildTaskNode({ task, depth = 0 }: ChildTaskNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = task.children_count > 0;

  // Only fetch children when expanded
  const { data: children, isLoading } = useTaskChildren(task.id, isExpanded && hasChildren);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const isCompleted = task.status === "done";
  const urgency = getTaskUrgency({
    status: task.status,
    due_date: task.due_date,
    completed_at: task.completed_at,
  });

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 group",
          depth > 0 && "ml-6 border-l-2 border-gray-200"
        )}
        style={depth > 0 ? { marginLeft: `${depth * 24}px` } : undefined}
      >
        {/* Expand button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={handleToggle}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {isLoading ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className={cn(
                  "w-3 h-3 transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        ) : (
          <div className="w-5 h-5" />
        )}

        {/* Task icon */}
        <svg
          className={cn(
            "w-4 h-4 flex-shrink-0",
            isCompleted ? "text-green-500" : "text-gray-400"
          )}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          {isCompleted ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>

        {/* Title */}
        <Link
          to={`/tasks/${task.id}`}
          className={cn(
            "flex-1 text-sm hover:text-blue-600 truncate",
            isCompleted ? "line-through text-gray-400" : "text-gray-900"
          )}
        >
          {task.title}
        </Link>

        {/* Children count badge */}
        {hasChildren && (
          <span className="text-xs text-gray-400">({task.children_count})</span>
        )}

        {/* Status badge */}
        <Badge type="status" value={task.status} size="sm" />

        {/* Urgency indicator */}
        {urgency.icon && (
          <span
            className="text-sm cursor-help"
            title={urgency.tooltip || undefined}
          >
            {urgency.icon}
          </span>
        )}

        {/* Open link */}
        <Link
          to={`/tasks/${task.id}`}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </Link>
      </div>

      {/* Render children recursively */}
      {isExpanded && children && children.length > 0 && (
        <div className="ml-4 mt-0.5">
          {children.map((child) => (
            <ChildTaskNode key={child.id} task={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
