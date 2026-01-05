import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../shared/ui";
import { useTasks, useBulkUpdateStatus, useBulkUpdatePriority, useBulkUpdateAssignee, useBulkDelete, taskKeys } from "../modules/tasks";
import { getTaskChildren } from "../modules/tasks/api";
import { TaskFilters, TaskList, TaskFormModal, BulkActionsBar, defaultColumnConfig } from "../modules/tasks/components";
import type { TaskFilters as TaskFiltersType, TaskStatus, TaskPriority, Task } from "../modules/tasks";
import type { SortConfig, SortField } from "../modules/tasks/components/TaskTableHeader";
import type { ColumnConfig, GroupByOption } from "../modules/tasks/components";
import type { ProjectsMap } from "../modules/tasks/components/TaskRow";
import { useUsersMap, useUsers } from "../modules/users";
import { useProjects } from "../modules/projects";
import { useAuth } from "../modules/auth";

const COLUMN_CONFIG_KEY = "smarttask360_task_columns";
const ITEMS_PER_PAGE = 20;

// Priority order for sorting
const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// Status order for sorting
const STATUS_ORDER: Record<string, number> = {
  new: 0,
  assigned: 1,
  in_progress: 2,
  in_review: 3,
  on_hold: 4,
  done: 5,
  cancelled: 6,
  draft: 7,
};

const GROUP_BY_KEY = "smarttask360_group_by";

export function TasksPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<TaskFiltersType>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sort, setSort] = useState<SortConfig>({ field: "created_at", order: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [groupBy, setGroupBy] = useState<GroupByOption>(() => {
    const saved = localStorage.getItem(GROUP_BY_KEY);
    return (saved as GroupByOption) || "none";
  });
  const [columnConfig, setColumnConfig] = useState<ColumnConfig>(() => {
    const saved = localStorage.getItem(COLUMN_CONFIG_KEY);
    if (saved) {
      try {
        return { ...defaultColumnConfig, ...JSON.parse(saved) };
      } catch {
        return defaultColumnConfig;
      }
    }
    return defaultColumnConfig;
  });

  // Save column config to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_CONFIG_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  // Save groupBy to localStorage
  useEffect(() => {
    localStorage.setItem(GROUP_BY_KEY, groupBy);
  }, [groupBy]);

  const { user: currentUser } = useAuth();

  // Track the last applied URL params to detect navigation changes
  const [lastAppliedParams, setLastAppliedParams] = useState<string | null>(null);

  // Sync URL params (role, status, search) to filters when URL changes
  useEffect(() => {
    const currentParamsString = searchParams.toString();

    // Only apply when URL actually changes (navigation from sidebar)
    if (currentParamsString === lastAppliedParams) return;

    const roleFromUrl = searchParams.get("role") as TaskFiltersType["role"] | null;
    const statusFromUrl = searchParams.get("status") as TaskStatus | null;
    const searchFromUrl = searchParams.get("search");

    // Build new filters from URL params
    let newFilters: TaskFiltersType = {};

    // Handle role parameter
    if (roleFromUrl && currentUser) {
      if (roleFromUrl === "assignee") {
        newFilters.assignee_id = currentUser.id;
      } else if (roleFromUrl === "creator") {
        newFilters.creator_id = currentUser.id;
      } else if (roleFromUrl === "watcher") {
        newFilters.role = "watcher";
      }
    }

    // Handle status parameter
    if (statusFromUrl) {
      newFilters.status = statusFromUrl;
    }

    // Handle search parameter
    if (searchFromUrl) {
      newFilters.search = searchFromUrl;
    }

    setFilters(newFilters);
    setLastAppliedParams(currentParamsString);
  }, [searchParams, currentUser]);

  const { data: tasks, isLoading } = useTasks(filters);
  const { data: allTasks } = useTasks(); // All tasks for total count
  const { usersMap } = useUsersMap();
  const { data: users = [] } = useUsers();

  const totalAllItems = allTasks?.length;
  const { data: projects = [] } = useProjects();

  // Build projectsMap for TaskList
  const projectsMap: ProjectsMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    for (const project of projects) {
      map.set(project.id, { id: project.id, name: project.name, code: project.code });
    }
    return map;
  }, [projects]);

  // Bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkUpdatePriority = useBulkUpdatePriority();
  const bulkUpdateAssignee = useBulkUpdateAssignee();
  const bulkDelete = useBulkDelete();

  const isBulkLoading = bulkUpdateStatus.isPending || bulkUpdatePriority.isPending || bulkUpdateAssignee.isPending || bulkDelete.isPending;

  // Hierarchy expansion state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadingChildrenIds, setLoadingChildrenIds] = useState<Set<string>>(new Set());
  const [childrenMap, setChildrenMap] = useState<Map<string, Task[]>>(new Map());

  const queryClient = useQueryClient();

  // Handle toggle expand
  const handleToggleExpand = useCallback(
    async (taskId: string) => {
      const isExpanded = expandedIds.has(taskId);

      if (isExpanded) {
        // Collapse: just remove from expanded set
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      } else {
        // Expand: load children if not cached
        const cachedChildren = childrenMap.get(taskId);

        if (cachedChildren) {
          // Already have children cached, just expand
          setExpandedIds((prev) => new Set(prev).add(taskId));
        } else {
          // Need to load children
          setLoadingChildrenIds((prev) => new Set(prev).add(taskId));

          try {
            // Try cache first from React Query
            const cached = queryClient.getQueryData<Task[]>(taskKeys.children(taskId));
            if (cached) {
              setChildrenMap((prev) => new Map(prev).set(taskId, cached));
              setExpandedIds((prev) => new Set(prev).add(taskId));
            } else {
              // Fetch from API
              const children = await getTaskChildren(taskId);
              setChildrenMap((prev) => new Map(prev).set(taskId, children));
              setExpandedIds((prev) => new Set(prev).add(taskId));
              // Also cache in React Query
              queryClient.setQueryData(taskKeys.children(taskId), children);
            }
          } catch (error) {
            console.error("Failed to load children:", error);
          } finally {
            setLoadingChildrenIds((prev) => {
              const next = new Set(prev);
              next.delete(taskId);
              return next;
            });
          }
        }
      }
    },
    [expandedIds, childrenMap, queryClient]
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Sort tasks on the client
  const sortedTasks = useMemo(() => {
    if (!tasks) return undefined;

    return [...tasks].sort((a, b) => {
      const { field, order } = sort;
      let comparison = 0;

      switch (field) {
        case "title":
          comparison = a.title.localeCompare(b.title, "ru");
          break;
        case "priority":
          comparison = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
          break;
        case "status":
          comparison = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
          break;
        case "due_date":
          // Tasks without due_date go to the end
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = a.due_date.localeCompare(b.due_date);
          break;
        case "created_at":
          comparison = a.created_at.localeCompare(b.created_at);
          break;
      }

      return order === "asc" ? comparison : -comparison;
    });
  }, [tasks, sort]);

  // Paginate tasks on the client
  const totalItems = sortedTasks?.length ?? 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedTasks = useMemo(() => {
    if (!sortedTasks) return undefined;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTasks.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTasks, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  // Bulk selection handlers
  const handleSelectionChange = useCallback((taskId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkStatusChange = useCallback(
    async (status: TaskStatus) => {
      const taskIds = Array.from(selectedIds);
      await bulkUpdateStatus.mutateAsync({ taskIds, status });
    },
    [selectedIds, bulkUpdateStatus]
  );

  const handleBulkPriorityChange = useCallback(
    async (priority: TaskPriority) => {
      const taskIds = Array.from(selectedIds);
      await bulkUpdatePriority.mutateAsync({ taskIds, priority });
    },
    [selectedIds, bulkUpdatePriority]
  );

  const handleBulkAssigneeChange = useCallback(
    async (assigneeId: string | null) => {
      const taskIds = Array.from(selectedIds);
      await bulkUpdateAssignee.mutateAsync({ taskIds, assigneeId });
    },
    [selectedIds, bulkUpdateAssignee]
  );

  const handleBulkDelete = useCallback(async () => {
    const taskIds = Array.from(selectedIds);
    await bulkDelete.mutateAsync(taskIds);
    // После удаления сбрасываем выделение, т.к. задач больше нет
    handleClearSelection();
  }, [selectedIds, bulkDelete, handleClearSelection]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Задачи</h1>
          <p className="text-gray-600 mt-1">
            Управление и отслеживание задач
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Group by toggle */}
          <button
            type="button"
            onClick={() => setGroupBy(groupBy === "project" ? "none" : "project")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
              groupBy === "project"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            title={groupBy === "project" ? "Отключить группировку" : "Группировать по проектам"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            По проектам
          </button>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Новая задача
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        columnConfig={columnConfig}
        onColumnConfigChange={setColumnConfig}
      />

      {/* Task List */}
      <TaskList
        tasks={paginatedTasks}
        isLoading={isLoading}
        sort={sort}
        onSortChange={handleSortChange}
        columnConfig={columnConfig}
        usersMap={usersMap}
        projectsMap={projectsMap}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        totalAllItems={totalAllItems}
        onPageChange={handlePageChange}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        expandedIds={expandedIds}
        loadingChildrenIds={loadingChildrenIds}
        childrenMap={childrenMap}
        onToggleExpand={handleToggleExpand}
        searchQuery={filters.search}
        groupBy={groupBy}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onStatusChange={handleBulkStatusChange}
        onPriorityChange={handleBulkPriorityChange}
        onAssigneeChange={handleBulkAssigneeChange}
        onDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
        isLoading={isBulkLoading}
        users={users}
      />

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
