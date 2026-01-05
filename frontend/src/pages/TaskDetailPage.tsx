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
  Dropdown,
  DropdownItem,
  DropdownDivider,
} from "../shared/ui";
import { cn, formatDate, formatDateTime, getShortId, copyToClipboard, getTaskUrl, getTaskUrgency } from "../shared/lib/utils";
import { useTask, useChangeTaskStatus, useDeleteTask, useTaskWatchers, useTaskParticipants } from "../modules/tasks";
import { TaskFormModal, ParentTaskLink, ChildTasksTree, StatusChangeModal, requiresStatusChangeModal, TaskDetailTabs } from "../modules/tasks/components";
import type { TaskStatus } from "../modules/tasks";
import { useUsersMap, getUserById } from "../modules/users";
import { ChecklistsPanel } from "../modules/checklists";
import { useProject } from "../modules/projects";

// Status labels for dropdown
const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "new", label: "Новая" },
  { value: "assigned", label: "Назначена" },
  { value: "in_progress", label: "В работе" },
  { value: "in_review", label: "На проверке" },
  { value: "rework", label: "На доработке" },
  { value: "on_hold", label: "На паузе" },
  { value: "done", label: "Готово" },
];

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateSubtaskModalOpen, setIsCreateSubtaskModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  // Status change modal state
  const [statusChangeModal, setStatusChangeModal] = useState<{
    isOpen: boolean;
    newStatus: TaskStatus | null;
  }>({ isOpen: false, newStatus: null });

  const { data: task, isLoading, error } = useTask(taskId || "");
  const { data: watchers = [] } = useTaskWatchers(taskId || "");
  const { data: participants = [] } = useTaskParticipants(taskId || "");
  const changeStatus = useChangeTaskStatus();
  const deleteTask = useDeleteTask();
  const { usersMap } = useUsersMap();

  // Fetch project info if task has project_id
  const { data: project } = useProject(task?.project_id || "", !!task?.project_id);

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
    // Check if this status change requires a modal
    if (requiresStatusChangeModal(newStatus)) {
      setStatusChangeModal({ isOpen: true, newStatus });
    } else {
      // Simple status change without modal
      changeStatus.mutate({
        taskId: task.id,
        data: { status: newStatus },
      });
    }
  };

  const handleStatusChangeConfirm = async (comment: string) => {
    if (!statusChangeModal.newStatus) return;

    await changeStatus.mutateAsync({
      taskId: task.id,
      data: { status: statusChangeModal.newStatus, comment },
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
        {project && (
          <>
            <span>/</span>
            <Link to={`/projects/${project.id}`} className="hover:text-gray-700">{project.name}</Link>
          </>
        )}
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
          {/* Quick Status Change Dropdown */}
          <Dropdown
            align="right"
            trigger={
              <button
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                disabled={changeStatus.isPending}
              >
                <Badge type="status" value={task.status} />
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            }
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <DropdownItem
                key={value}
                onClick={() => handleStatusChange(value)}
                disabled={task.status === value}
                icon={
                  task.status === value ? (
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : undefined
                }
              >
                {label}
              </DropdownItem>
            ))}
          </Dropdown>

          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            Редактировать
          </Button>

          {/* More Actions Dropdown */}
          <Dropdown
            align="right"
            trigger={
              <Button variant="outline" size="sm">
                Ещё
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Button>
            }
          >
            <DropdownItem
              onClick={handleCopyLink}
              icon={
                linkCopied ? (
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                )
              }
            >
              {linkCopied ? "Скопировано!" : "Скопировать ссылку"}
            </DropdownItem>
            <DropdownItem
              onClick={() => setIsCreateSubtaskModalOpen(true)}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Добавить подзадачу
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              onClick={handleDelete}
              danger
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              }
            >
              Удалить задачу
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Main Content */}
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

          {/* Checklists Section */}
          <ChecklistsPanel taskId={task.id} />

          {/* Completion Result (for done tasks) */}
          {task.status === "done" && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <CardTitle>Результат выполнения</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-400 italic text-sm">Функционал находится в разработке</p>
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

          {/* Tabs: Comments, History, Documents */}
          <TaskDetailTabs taskId={task.id} />
        </div>

        {/* Compact Sidebar */}
        <div className="w-72 shrink-0">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Assignee - most important */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Исполнитель</span>
                {assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={assignee.name} size="sm" />
                    <span className="text-sm font-medium truncate max-w-[120px]">{assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Не назначен</span>
                )}
              </div>

              {/* Creator */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Постановщик</span>
                {creator ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={creator.name} size="sm" />
                    <span className="text-sm font-medium truncate max-w-[120px]">{creator.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>

              {/* Project */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Проект</span>
                {project ? (
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate max-w-[140px]"
                    title={project.name}
                  >
                    {project.name}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>

              {/* Due Date */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Срок</span>
                <div className="flex items-center gap-1">
                  <span className={cn("text-sm font-medium", urgency.status === "overdue" && "text-red-600")}>
                    {task.due_date ? formatDate(task.due_date) : "—"}
                  </span>
                  {urgency.icon && (
                    <span className="cursor-help" title={urgency.tooltip || undefined}>
                      {urgency.icon}
                    </span>
                  )}
                </div>
              </div>

              {/* Time Estimate */}
              {(task.estimated_hours || task.actual_hours) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Время</span>
                  <span className="text-sm">
                    {task.actual_hours ? `${task.actual_hours}` : "0"} / {task.estimated_hours || "—"} ч.
                  </span>
                </div>
              )}

              {/* Milestone badge */}
              {task.is_milestone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Тип</span>
                  <Badge type="status" value="milestone" className="bg-purple-100 text-purple-800">
                    Веха
                  </Badge>
                </div>
              )}

              {/* Divider if has additional people */}
              {(participants.length > 0 || watchers.length > 0 || author) && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {/* Author if different from creator */}
                  {author && author.id !== creator?.id && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Автор</span>
                      <div className="flex items-center gap-2">
                        <Avatar name={author.name} size="sm" />
                        <span className="text-sm truncate max-w-[120px]">{author.name}</span>
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {participants.length > 0 && (
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-gray-500">Соисполнители</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {participants.slice(0, 3).map((user) => (
                          <Avatar key={user.id} name={user.name} size="sm" title={user.name} />
                        ))}
                        {participants.length > 3 && (
                          <span className="text-xs text-gray-500 self-center">+{participants.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Watchers */}
                  {watchers.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-gray-500">Наблюдатели</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {watchers.slice(0, 3).map((user) => (
                          <Avatar key={user.id} name={user.name} size="sm" title={user.name} />
                        ))}
                        {watchers.length > 3 && (
                          <span className="text-xs text-gray-500 self-center">+{watchers.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline - collapsible */}
              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Создана</span>
                    <span>{formatDateTime(task.created_at)}</span>
                  </div>
                  {task.started_at && (
                    <div className="flex justify-between">
                      <span>Начата</span>
                      <span>{formatDateTime(task.started_at)}</span>
                    </div>
                  )}
                  {task.completed_at && (
                    <div className="flex justify-between">
                      <span>Завершена</span>
                      <span>{formatDateTime(task.completed_at)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Обновлена</span>
                    <span>{formatDateTime(task.updated_at)}</span>
                  </div>
                </div>
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

      {/* Create Subtask Modal */}
      <TaskFormModal
        isOpen={isCreateSubtaskModalOpen}
        onClose={() => setIsCreateSubtaskModalOpen(false)}
        parentId={task.id}
      />

      {/* Status Change Modal */}
      {statusChangeModal.newStatus && (
        <StatusChangeModal
          isOpen={statusChangeModal.isOpen}
          onClose={() => setStatusChangeModal({ isOpen: false, newStatus: null })}
          taskId={task.id}
          currentStatus={task.status}
          newStatus={statusChangeModal.newStatus}
          onConfirm={handleStatusChangeConfirm}
        />
      )}
    </div>
  );
}
