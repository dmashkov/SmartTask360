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
import { cn, formatDate, formatDateTime, getShortId, copyToClipboard, getTaskUrl, getTaskUrgency } from "../shared/lib/utils";
import { useTask, useChangeTaskStatus, useDeleteTask, useTaskWatchers, useTaskParticipants } from "../modules/tasks";
import { TaskFormModal, ParentTaskLink, ChildTasksTree } from "../modules/tasks/components";
import type { TaskStatus } from "../modules/tasks";
import { useUsersMap, getUserById } from "../modules/users";
import { ChecklistsPanel } from "../modules/checklists";

type TaskDetailTab = "main" | "documents" | "comments" | "history";

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateSubtaskModalOpen, setIsCreateSubtaskModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskDetailTab>("main");

  const { data: task, isLoading, error } = useTask(taskId || "");
  const { data: watchers = [] } = useTaskWatchers(taskId || "");
  const { data: participants = [] } = useTaskParticipants(taskId || "");
  const changeStatus = useChangeTaskStatus();
  const deleteTask = useDeleteTask();
  const { usersMap } = useUsersMap();

  // Get user details
  const author = task ? getUserById(usersMap, task.author_id) : undefined;
  const creator = task ? getUserById(usersMap, task.creator_id) : undefined;
  const assignee = task ? getUserById(usersMap, task.assignee_id) : undefined;

  const handleCopyLink = async () => {
    if (task) {
      const success = await copyToClipboard(getTaskUrl(task.id));
      if (success) {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }
    }
  };

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

  const urgency = getTaskUrgency({
    status: task.status,
    due_date: task.due_date,
    completed_at: task.completed_at,
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/tasks" className="hover:text-gray-700">Задачи</Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{task.title}</span>
      </nav>

      {/* Parent Task Link */}
      {task.parent_id && <ParentTaskLink parentId={task.parent_id} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded" title={task.id}>
              {getShortId(task.id)}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <Badge type="priority" value={task.priority} />
            <Badge type="status" value={task.status} />
            {/* Urgency indicator */}
            {urgency.label && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium",
                  urgency.colorClass
                )}
                title={urgency.tooltip || undefined}
              >
                {urgency.icon && <span>{urgency.icon}</span>}
                {urgency.label}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            Создана {formatDateTime(task.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            title="Скопировать ссылку"
          >
            {linkCopied ? (
              <>
                <svg className="h-4 w-4 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Скопировано
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                Ссылка
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Редактировать
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Удалить
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab("main")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "main"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Основное
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "documents"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Документы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "comments"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Комментарии
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={cn(
              "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            История
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "main" ? (
        <div className="flex gap-6">
          {/* Main content - flexible width */}
          <div className="flex-1 min-w-0 space-y-6">
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

          {/* Checklists Section */}
          <Card>
            <CardContent className="pt-6">
              <ChecklistsPanel taskId={task.id} />
            </CardContent>
          </Card>

          {/* Subtasks Section */}
          {task.children_count > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Подзадачи ({task.children_count})</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateSubtaskModalOpen(true)}
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Добавить подзадачу
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <ChildTasksTree taskId={task.id} childrenCount={task.children_count} />
              </CardContent>
            </Card>
          )}

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

          {/* Completion Result (for done tasks) */}
          {task.status === "done" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <CardTitle>Результат выполнения</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-400 italic">Функционал находится в разработке</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Здесь будет текст результата и прикреплённые документы
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
        <div className="w-80 shrink-0 space-y-6">
          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle>Участники</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Автор</label>
                <div className="mt-1 flex items-center gap-2">
                  {author ? (
                    <>
                      <Avatar name={author.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{author.name}</p>
                        <p className="text-xs text-gray-500 truncate">{author.email}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">Не определён</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Постановщик</label>
                <div className="mt-1 flex items-center gap-2">
                  {creator ? (
                    <>
                      <Avatar name={creator.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{creator.name}</p>
                        <p className="text-xs text-gray-500 truncate">{creator.email}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">Не определён</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Исполнитель</label>
                <div className="mt-1 flex items-center gap-2">
                  {assignee ? (
                    <>
                      <Avatar name={assignee.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{assignee.name}</p>
                        <p className="text-xs text-gray-500 truncate">{assignee.email}</p>
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">Не назначен</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Срок выполнения</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className={urgency.status === "overdue" ? "text-red-600" : "text-gray-900"}>
                    {task.due_date ? formatDate(task.due_date) : "Не указан"}
                  </span>
                  {urgency.icon && (
                    <span
                      className="cursor-help"
                      title={urgency.tooltip || undefined}
                    >
                      {urgency.icon}
                    </span>
                  )}
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

          {/* Participants (Co-executors) */}
          {participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Соисполнители</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Avatar name={user.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Watchers */}
          {watchers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Наблюдатели</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {watchers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Avatar name={user.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
      ) : activeTab === "documents" ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Документы</h3>
              <p className="mt-1 text-sm text-gray-500">Функционал находится в разработке</p>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === "comments" ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Комментарии</h3>
              <p className="mt-1 text-sm text-gray-500">Функционал находится в разработке</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">История изменений</h3>
              <p className="mt-1 text-sm text-gray-500">Функционал находится в разработке</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />

      {/* Create Subtask Modal */}
      <TaskFormModal
        isOpen={isCreateSubtaskModalOpen}
        onClose={() => setIsCreateSubtaskModalOpen(false)}
        parentId={task.id}
      />
    </div>
  );
}
