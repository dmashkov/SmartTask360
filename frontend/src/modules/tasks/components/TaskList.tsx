import { Card, CardContent, EmptyState, EmptyStateIcons, Loading, Pagination } from "../../../shared/ui";
import { TaskRow, type ProjectsMap } from "./TaskRow";
import { TaskTableHeader, type SortConfig, type SortField } from "./TaskTableHeader";
import type { ColumnConfig } from "./TaskFilters";
import type { Task } from "../types";
import type { UsersMap } from "../../users";

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
}: TaskListProps) {
  const hasFilters = totalAllItems !== undefined && totalItems !== undefined && totalItems !== totalAllItems;

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
