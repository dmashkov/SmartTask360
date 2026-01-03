import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Loading,
  Avatar,
} from "../shared/ui";
import { formatDate, formatDateTime } from "../shared/lib/utils";
import { useTask, useChangeTaskStatus, useDeleteTask } from "../modules/tasks";
import { TaskFormModal } from "../modules/tasks/components";
import type { TaskStatus } from "../modules/tasks";

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: task, isLoading, error } = useTask(taskId || "");
  const changeStatus = useChangeTaskStatus();
  const deleteTask = useDeleteTask();

  if (isLoading) {
    return <Loading message="Загрузка задачи..." />;
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Задача не найдена</h1>
        <p className="text-gray-600 mt-2">Запрашиваемая задача не существует.</p>
        <Button className="mt-4" onClick={() => navigate("/tasks")}>
          К списку задач
        </Button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    changeStatus.mutate({
      taskId: task.id,
      data: { status: newStatus },
    });
  };

  const handleDelete = async () => {
    if (window.confirm("Вы уверены, что хотите удалить эту задачу?")) {
      await deleteTask.mutateAsync(task.id);
      navigate("/tasks");
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date + "Z") < new Date() && task.status !== "done";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/tasks" className="hover:text-gray-700">Задачи</Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{task.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <Badge type="priority" value={task.priority} />
            <Badge type="status" value={task.status} />
          </div>
          <p className="text-gray-500 mt-1">
            Создана {formatDateTime(task.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Редактировать
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Удалить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Описание</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-gray-400 italic">Описание не указано</p>
              )}
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Изменить статус</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "new", label: "Новая" },
                  { value: "assigned", label: "Назначена" },
                  { value: "in_progress", label: "В работе" },
                  { value: "in_review", label: "На проверке" },
                  { value: "on_hold", label: "На паузе" },
                  { value: "done", label: "Готово" },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={task.status === value ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(value as TaskStatus)}
                    disabled={changeStatus.isPending}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SMART Score */}
          {task.smart_score && (
            <Card>
              <CardHeader>
                <CardTitle>SMART-валидация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-lg font-semibold ${task.smart_is_valid ? "text-green-600" : "text-yellow-600"}`}>
                    {task.smart_is_valid ? "Соответствует" : "Требует доработки"}
                  </span>
                  {task.smart_validated_at && (
                    <span className="text-sm text-gray-500">
                      Проверено {formatDateTime(task.smart_validated_at)}
                    </span>
                  )}
                </div>
                <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(task.smart_score, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Исполнитель</label>
                <div className="mt-1 flex items-center gap-2">
                  {task.assignee_id ? (
                    <>
                      <Avatar name="Исполнитель" size="sm" />
                      <span className="text-gray-900">Назначен</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Не назначен</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Срок выполнения</label>
                <div className={`mt-1 ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
                  {task.due_date ? formatDate(task.due_date) : "Не указан"}
                  {isOverdue && " (Просрочено)"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Оценка времени</label>
                <div className="mt-1 text-gray-900">
                  {task.estimated_hours ? `${task.estimated_hours} ч.` : "Не указано"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Фактическое время</label>
                <div className="mt-1 text-gray-900">
                  {task.actual_hours ? `${task.actual_hours} ч.` : "Не учтено"}
                </div>
              </div>

              {task.is_milestone && (
                <div>
                  <Badge type="status" value="milestone" className="bg-purple-100 text-purple-800">
                    Веха
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Хронология</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Создана</span>
                <span className="text-gray-900">{formatDateTime(task.created_at)}</span>
              </div>
              {task.started_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Начата</span>
                  <span className="text-gray-900">{formatDateTime(task.started_at)}</span>
                </div>
              )}
              {task.accepted_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Принята</span>
                  <span className="text-gray-900">{formatDateTime(task.accepted_at)}</span>
                </div>
              )}
              {task.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Завершена</span>
                  <span className="text-gray-900">{formatDateTime(task.completed_at)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Обновлена</span>
                <span className="text-gray-900">{formatDateTime(task.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />
    </div>
  );
}
