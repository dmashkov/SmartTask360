import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, EmptyState, EmptyStateIcons, Loading, Pagination } from "../../../shared/ui";
import { TaskRow, type ProjectsMap } from "./TaskRow";
import { TaskTableHeader, type SortConfig, type SortField } from "./TaskTableHeader";
import type { ColumnConfig } from "./TaskFilters";
import type { Task } from "../types";
import type { UsersMap } from "../../users";

// Grouping options
export type GroupByOption = "none" | "project" | "status" | "priority";

interface TaskListProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  columnConfig: ColumnConfig;
  usersMap: UsersMap;
  projectsMap?: ProjectsMap;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  totalAllItems?: number; // Total without filters
  onPageChange?: (page: number) => void;
  // Bulk selection
  selectedIds?: Set<string>;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
  // Hierarchy expansion
  expandedIds?: Set<string>;
  loadingChildrenIds?: Set<string>;
  childrenMap?: Map<string, Task[]>;
  onToggleExpand?: (taskId: string) => void;
  // Search highlight
  searchQuery?: string;
  // Grouping
  groupBy?: GroupByOption;
}

export function TaskList({
  tasks,
  isLoading,
  sort,
  onSortChange,
  columnConfig,
  usersMap,
  projectsMap = new Map(),
  currentPage = 1,
  totalPages = 1,
  totalItems,
  totalAllItems,
  onPageChange,
  selectedIds = new Set(),
  onSelectionChange,
  expandedIds = new Set(),
  loadingChildrenIds = new Set(),
  childrenMap = new Map(),
  onToggleExpand,
  searchQuery = "",
  groupBy = "none",
}: TaskListProps) {
  const hasFilters = totalAllItems !== undefined && totalItems !== undefined && totalItems !== totalAllItems;

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    if (groupBy !== "project" || !tasks) return null;

    const groups = new Map<string | null, { project: { id: string; name: string; code: string } | null; tasks: Task[] }>();

    // Filter to root tasks first
    const taskIds = new Set(tasks.map(t => t.id));
    const rootTasks = tasks.filter(task => !task.parent_id || !taskIds.has(task.parent_id));

    for (const task of rootTasks) {
      const projectId = task.project_id;
      if (!groups.has(projectId)) {
        const project = projectId ? projectsMap.get(projectId) || null : null;
        groups.set(projectId, { project, tasks: [] });
      }
      groups.get(projectId)!.tasks.push(task);
    }

    // Sort groups: projects first (alphabetically), then "No Project"
    const sortedGroups = Array.from(groups.entries()).sort(([keyA, a], [keyB, b]) => {
      if (!keyA) return 1; // "No Project" last
      if (!keyB) return -1;
      return (a.project?.name || "").localeCompare(b.project?.name || "", "ru");
    });

    return sortedGroups;
  }, [tasks, groupBy, projectsMap]);

  // Recursive function to render task and its children
  const renderTaskWithChildren = (task: Task): React.ReactNode[] => {
    const isExpanded = expandedIds.has(task.id);
    const isLoadingChildren = loadingChildrenIds.has(task.id);
    const children = childrenMap.get(task.id) || [];

    const nodes: React.ReactNode[] = [
      <TaskRow
        key={task.id}
        task={task}
        columnConfig={columnConfig}
        usersMap={usersMap}
        projectsMap={projectsMap}
        isSelected={selectedIds.has(task.id)}
        onSelect={onSelectionChange}
        isExpanded={isExpanded}
        isLoadingChildren={isLoadingChildren}
        onToggleExpand={onToggleExpand}
        searchQuery={searchQuery}
      />,
    ];

    // If expanded and has loaded children, render them recursively
    if (isExpanded && children.length > 0) {
      children.forEach((child) => {
        nodes.push(...renderTaskWithChildren(child));
      });
    }

    return nodes;
  };

  if (isLoading) {
    return <Loading message="Загрузка задач..." />;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={EmptyStateIcons.tasks}
            title="Задачи не найдены"
            description="Создайте первую задачу для начала работы"
          />
        </CardContent>
      </Card>
    );
  }

  // Filter to render only root-level tasks (those without parent in current list)
  const taskIds = new Set(tasks.map(t => t.id));
  const rootTasks = tasks.filter(task => !task.parent_id || !taskIds.has(task.parent_id));

  // Render grouped view
  if (groupBy === "project" && groupedTasks) {
    return (
      <div className="space-y-4">
        {groupedTasks.map(([projectId, group]) => (
          <Card key={projectId || "no-project"} className="overflow-hidden">
            {/* Project Header */}
            <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              {group.project ? (
                <Link
                  to={`/projects/${group.project.id}`}
                  className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <span>{group.project.name}</span>
                  <span className="text-gray-400 font-normal">({group.project.code})</span>
                </Link>
              ) : (
                <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  Без проекта
                </span>
              )}
              <span className="text-xs text-gray-400">{group.tasks.length} задач</span>
            </div>
            <TaskTableHeader sort={sort} onSortChange={onSortChange} columnConfig={columnConfig} />
            <div className="divide-y divide-gray-100">
              {group.tasks.map((task) => renderTaskWithChildren(task))}
            </div>
          </Card>
        ))}

        {/* Footer with count and pagination */}
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-gray-500">
            {totalItems !== undefined && (
              hasFilters
                ? `${totalItems} (из ${totalAllItems})`
                : `Всего: ${totalItems}`
            )}
          </span>
          {totalPages > 1 && onPageChange && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </div>
      </div>
    );
  }

  // Default flat view
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <TaskTableHeader sort={sort} onSortChange={onSortChange} columnConfig={columnConfig} />
        <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
          <div className="divide-y divide-gray-100">
            {rootTasks.map((task) => renderTaskWithChildren(task))}
          </div>
        </div>
      </Card>

      {/* Footer with count and pagination */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-gray-500">
          {totalItems !== undefined && (
            hasFilters
              ? `${totalItems} (из ${totalAllItems})`
              : `Всего: ${totalItems}`
          )}
        </span>
        {totalPages > 1 && onPageChange && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
}
