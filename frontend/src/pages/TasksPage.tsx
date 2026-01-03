import { useState, useMemo } from "react";
import { Button } from "../shared/ui";
import { useTasks, useChangeTaskStatus } from "../modules/tasks";
import { TaskFilters, TaskList, TaskFormModal } from "../modules/tasks/components";
import type { TaskFilters as TaskFiltersType, Task } from "../modules/tasks";
import type { SortConfig, SortField } from "../modules/tasks/components/TaskTableHeader";

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

export function TasksPage() {
  const [filters, setFilters] = useState<TaskFiltersType>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sort, setSort] = useState<SortConfig>({ field: "created_at", order: "desc" });

  const { data: tasks, isLoading } = useTasks(filters);
  const changeStatus = useChangeTaskStatus();

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

  const handleStatusToggle = (task: Task) => {
    const newStatus = task.status === "done" ? "in_progress" : "done";
    changeStatus.mutate({
      taskId: task.id,
      data: { status: newStatus },
    });
  };

  const handleSortChange = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Новая задача
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {/* Task List */}
      <TaskList
        tasks={sortedTasks}
        isLoading={isLoading}
        onStatusToggle={handleStatusToggle}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
