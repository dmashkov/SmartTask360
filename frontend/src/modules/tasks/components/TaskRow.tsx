import { Link } from "react-router-dom";
import { Badge, Avatar, Checkbox } from "../../../shared/ui";
import { formatDate, formatDateTime, getShortId, getTaskUrgency, getHighlightParts } from "../../../shared/lib/utils";
import type { Task } from "../types";
import type { ColumnConfig } from "./TaskFilters";
import { type UsersMap, getUserById } from "../../users";
import { TaskExpandButton } from "./TaskExpandButton";

// Projects map type for displaying project names
export type ProjectsMap = Map<string, { id: string; name: string; code: string }>;

export function getProjectById(projectsMap: ProjectsMap, projectId: string | null): { id: string; name: string; code: string } | null {
  if (!projectId) return null;
  return projectsMap.get(projectId) || null;
}

interface TaskRowProps {
  task: Task;
  columnConfig: ColumnConfig;
  usersMap: UsersMap;
  projectsMap?: ProjectsMap;
  isSelected?: boolean;
  onSelect?: (taskId: string, selected: boolean) => void;
  // Hierarchy props
  isExpanded?: boolean;
  isLoadingChildren?: boolean;
  onToggleExpand?: (taskId: string) => void;
  // Search highlight
  searchQuery?: string;
}

export function TaskRow({
  task,
  columnConfig,
  usersMap,
  projectsMap = new Map(),
  isSelected = false,
  onSelect,
  isExpanded = false,
  isLoadingChildren = false,
  onToggleExpand,
  searchQuery = "",
}: TaskRowProps) {
  const isCompleted = task.status === "done";
  const urgency = getTaskUrgency({
    status: task.status,
    due_date: task.due_date,
    completed_at: task.completed_at,
  });

  const author = getUserById(usersMap, task.author_id);
  const creator = getUserById(usersMap, task.creator_id);
  const assignee = getUserById(usersMap, task.assignee_id);
  const project = getProjectById(projectsMap, task.project_id);

  const handleCheckboxChange = () => {
    onSelect?.(task.id, !isSelected);
  };

  const handleToggleExpand = () => {
    onToggleExpand?.(task.id);
  };

  // Calculate indent based on depth (24px per level)
  const indentStyle = task.depth > 0 ? { paddingLeft: `${task.depth * 24}px` } : undefined;

  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}>
      {/* Expand button + Checkbox in indented container */}
      <div className="flex items-center gap-1" style={indentStyle}>
        <TaskExpandButton
          isExpanded={isExpanded}
          isLoading={isLoadingChildren}
          childrenCount={task.children_count}
          onClick={handleToggleExpand}
        />
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
        />
      </div>

      {/* ID */}
      {columnConfig.id && (
        <div className="w-16 shrink-0">
          <span className="text-xs font-mono text-gray-400" title={task.id}>
            {getShortId(task.id)}
          </span>
        </div>
      )}

      {/* Title - always visible */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/tasks/${task.id}`}
          className={`text-sm hover:text-blue-600 ${
            isCompleted ? "line-through text-gray-400" : "text-gray-900"
          }`}
        >
          {getHighlightParts(task.title, searchQuery).map((part, i) =>
            part.isHighlight ? (
              <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            )
          )}
        </Link>
        {/* Show children count for tasks with children */}
        {task.children_count > 0 && (
          <span className="text-xs text-gray-400 ml-2">
            ({task.children_count})
          </span>
        )}
      </div>

      {/* Project */}
      {columnConfig.project && (
        <div className="w-28 shrink-0">
          {project ? (
            <Link
              to={`/projects/${project.id}`}
              className="text-xs text-blue-600 hover:text-blue-700 truncate block"
              title={project.name}
            >
              {project.code}
            </Link>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      )}

      {/* Author - who physically created */}
      {columnConfig.author && (
        <div className="w-24 shrink-0">
          {author ? (
            <div className="flex items-center gap-1">
              <Avatar name={author.name} size="xs" />
              <span className="text-xs text-gray-600 truncate">{author.name}</span>
            </div>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      )}

      {/* Creator - on whose behalf */}
      {columnConfig.creator && (
        <div className="w-24 shrink-0">
          {creator ? (
            <div className="flex items-center gap-1">
              <Avatar name={creator.name} size="xs" />
              <span className="text-xs text-gray-600 truncate">{creator.name}</span>
            </div>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      )}

      {/* Assignee - who will execute */}
      {columnConfig.assignee && (
        <div className="w-24 shrink-0">
          {assignee ? (
            <div className="flex items-center gap-1">
              <Avatar name={assignee.name} size="xs" />
              <span className="text-xs text-gray-600 truncate">{assignee.name}</span>
            </div>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </div>
      )}

      {/* Due Date */}
      {columnConfig.dueDate && (
        <div className="w-32 text-xs flex items-center gap-1">
          {task.due_date ? (
            <>
              <span className="text-gray-600">
                {formatDate(task.due_date)}
              </span>
              {/* Urgency indicator */}
              {urgency.icon && (
                <span
                  className="cursor-help"
                  title={urgency.tooltip || undefined}
                >
                  {urgency.icon}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>
      )}

      {/* Priority */}
      {columnConfig.priority && (
        <div className="w-20">
          <Badge type="priority" value={task.priority} size="sm" />
        </div>
      )}

      {/* Status */}
      {columnConfig.status && (
        <div className="w-24">
          <Badge type="status" value={task.status} size="sm" />
        </div>
      )}

      {/* Created */}
      {columnConfig.createdAt && (
        <div className="w-28 text-xs text-gray-500">
          {formatDateTime(task.created_at)}
        </div>
      )}

      {/* Actions */}
      <div className="w-5">
        <Link
          to={`/tasks/${task.id}`}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
