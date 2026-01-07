/**
 * SmartTask360 — Project Tasks Tab
 * Displays list of tasks belonging to a project with full table view
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Spinner, Badge, EmptyState, Button, Avatar, Card, Checkbox } from "../../../shared/ui";
import { useProjectTasks } from "../hooks";
import { formatDate, formatDateTime, getTaskUrgency, getShortId } from "../../../shared/lib/utils";
import type { Task, TaskStatus } from "../../tasks/types";
import { TaskFormModal } from "../../tasks/components/TaskFormModal";
import { useUsersMap, getUserById, type UsersMap } from "../../users";

interface ProjectTasksTabProps {
  projectId: string;
}

// Sort options
type SortField = "id" | "title" | "due_date" | "priority" | "status" | "created_at";
type SortDirection = "asc" | "desc";

const completedStatuses: TaskStatus[] = ["done", "cancelled"];

// Priority order for sorting
const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// Status order for sorting
const statusOrder: Record<string, number> = {
  in_progress: 0,
  rework: 1,      // Returned from review - high priority
  in_review: 2,
  assigned: 3,
  new: 4,
  on_hold: 5,
  done: 6,
  cancelled: 7,
  draft: 8,
};

// Sort indicator
function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <svg
      className={`w-3 h-3 ml-1 inline-block transition-colors ${active ? "text-blue-600" : "text-gray-300"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {direction === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

// Table header component with sorting
interface TaskTableHeaderCompactProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function TaskTableHeaderCompact({ sortField, sortDirection, onSort }: TaskTableHeaderCompactProps) {
  const SortableHeader = ({ field, label, width }: { field: SortField; label: string; width: string }) => (
    <button
      onClick={() => onSort(field)}
      className={`${width} shrink-0 text-left hover:text-gray-700 flex items-center transition-colors`}
    >
      {label}
      <SortIcon active={sortField === field} direction={sortField === field ? sortDirection : "asc"} />
    </button>
  );

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
      <SortableHeader field="id" label="ID" width="w-16" />
      <SortableHeader field="title" label="Название" width="flex-1 min-w-0" />
      <div className="w-24 shrink-0 text-left">Исполнитель</div>
      <SortableHeader field="due_date" label="Срок" width="w-28" />
      <SortableHeader field="priority" label="Приоритет" width="w-20" />
      <SortableHeader field="status" label="Статус" width="w-24" />
      <SortableHeader field="created_at" label="Создана" width="w-32" />
      <div className="w-5 shrink-0"></div>
    </div>
  );
}

// Task row component matching main task list style
function TaskRowCompact({ task, usersMap }: { task: Task; usersMap: UsersMap }) {
  const isCompleted = task.status === "done";
  const urgency = getTaskUrgency({
    status: task.status,
    due_date: task.due_date,
    completed_at: task.completed_at,
  });

  const assignee = getUserById(usersMap, task.assignee_id);

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
    >
      {/* ID */}
      <div className="w-16 shrink-0">
        <span className="text-xs font-mono text-gray-400" title={task.id}>
          {getShortId(task.id)}
        </span>
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
            ({task.children_count})
          </span>
        )}
      </div>

      {/* Assignee */}
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

      {/* Due date with urgency */}
      <div className="w-28 shrink-0 text-xs flex items-center gap-1">
        {task.due_date ? (
          <>
            <span className="text-gray-600">{formatDate(task.due_date)}</span>
            {urgency.icon && (
              <span title={urgency.tooltip || undefined}>{urgency.icon}</span>
            )}
          </>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Priority */}
      <div className="w-20 shrink-0">
        <Badge type="priority" value={task.priority} size="sm" />
      </div>

      {/* Status */}
      <div className="w-24 shrink-0">
        <Badge type="status" value={task.status} size="sm" />
      </div>

      {/* Created at */}
      <div className="w-32 shrink-0 text-xs text-gray-500">
        {formatDateTime(task.created_at)}
      </div>

      {/* Arrow */}
      <div className="w-5 shrink-0">
        <svg
          className="h-4 w-4 text-gray-400"
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
      </div>
    </Link>
  );
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const { data, isLoading, error } = useProjectTasks(projectId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { usersMap } = useUsersMap();

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter state
  const [hideCompleted, setHideCompleted] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      // Default direction depends on field
      setSortDirection(field === "title" ? "asc" : "desc");
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let tasks = data?.items || [];

    // Filter to show only root tasks (no parent in current list)
    const taskIds = new Set(tasks.map(t => t.id));
    tasks = tasks.filter(task => !task.parent_id || !taskIds.has(task.parent_id));

    // Hide completed if enabled
    if (hideCompleted) {
      tasks = tasks.filter(task => !completedStatuses.includes(task.status));
    }

    // Sort
    tasks = [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "id":
          // Sort by ID (UUID) - effectively by creation order
          comparison = a.id.localeCompare(b.id);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title, "ru");
          break;
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority":
          comparison = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          break;
        case "status":
          comparison = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return tasks;
  }, [data?.items, sortField, sortDirection, hideCompleted]);

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

  // Count completed tasks
  const completedCount = (data?.items || []).filter(t => completedStatuses.includes(t.status)).length;

  return (
    <div>
      {/* Filter options */}
      {completedCount > 0 && (
        <div className="px-4 py-2 border-b border-gray-200 bg-white">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <Checkbox
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
            />
            <span className="text-sm text-gray-600">
              Скрыть выполненные ({completedCount})
            </span>
          </label>
        </div>
      )}

      {/* Table with header */}
      <Card className="overflow-hidden border-0 rounded-none">
        <TaskTableHeaderCompact
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <div className="max-h-[400px] overflow-y-auto">
          {filteredAndSortedTasks.length > 0 ? (
            filteredAndSortedTasks.map((task) => (
              <TaskRowCompact key={task.id} task={task} usersMap={usersMap} />
            ))
          ) : (
            <div className="py-8 text-center text-gray-500 text-sm">
              {hideCompleted ? "Нет активных задач" : "Нет задач"}
            </div>
          )}
        </div>
      </Card>

      {/* Footer with link to full list */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Показано: {filteredAndSortedTasks.length} из {data?.total || 0}
        </span>
        <Link
          to={`/tasks?project_id=${projectId}`}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Открыть полный список задач →
        </Link>
      </div>
    </div>
  );
}
