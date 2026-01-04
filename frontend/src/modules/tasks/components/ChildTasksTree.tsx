import { useTaskChildren } from "../hooks/useTasks";
import { ChildTaskNode } from "./ChildTaskNode";
import { EmptyState, EmptyStateIcons, Loading } from "../../../shared/ui";

interface ChildTasksTreeProps {
  taskId: string;
  childrenCount: number;
}

export function ChildTasksTree({ taskId, childrenCount }: ChildTasksTreeProps) {
  const { data: children, isLoading, error } = useTaskChildren(taskId, childrenCount > 0);

  if (childrenCount === 0) {
    return (
      <EmptyState
        icon={EmptyStateIcons.tasks}
        title="Нет подзадач"
        description="У этой задачи нет подзадач. Создайте подзадачу для декомпозиции работы."
      />
    );
  }

  if (isLoading) {
    return <Loading message="Загрузка подзадач..." />;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Не удалось загрузить подзадачи
      </div>
    );
  }

  if (!children || children.length === 0) {
    return (
      <EmptyState
        icon={EmptyStateIcons.tasks}
        title="Нет подзадач"
        description="Подзадачи не найдены"
      />
    );
  }

  return (
    <div className="space-y-1">
      {children.map((child) => (
        <ChildTaskNode key={child.id} task={child} depth={0} />
      ))}
    </div>
  );
}
