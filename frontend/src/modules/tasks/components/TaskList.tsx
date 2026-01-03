import { Card, CardContent, EmptyState, EmptyStateIcons, Loading } from "../../../shared/ui";
import { TaskRow } from "./TaskRow";
import { TaskTableHeader, type SortConfig, type SortField } from "./TaskTableHeader";
import type { Task } from "../types";

interface TaskListProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  onStatusToggle?: (task: Task) => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
}

export function TaskList({ tasks, isLoading, onStatusToggle, sort, onSortChange }: TaskListProps) {
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

  return (
    <Card className="overflow-hidden">
      <TaskTableHeader sort={sort} onSortChange={onSortChange} />
      <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusToggle={onStatusToggle}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
