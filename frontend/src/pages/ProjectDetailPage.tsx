/**
 * SmartTask360 — Project detail page
 */

import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Button,
  Spinner,
  EmptyState,
  Progress,
} from "../shared/ui";
import {
  useProject,
  useDeleteProject,
  ProjectStatusBadge,
  ProjectFormModal,
} from "../modules/projects";

type ViewMode = "tasks" | "boards" | "members";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading, error } = useProject(projectId || "");
  const deleteProject = useDeleteProject();

  const [viewMode, setViewMode] = useState<ViewMode>("tasks");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!projectId) return;

    if (window.confirm("Вы уверены, что хотите удалить этот проект?")) {
      try {
        await deleteProject.mutateAsync(projectId);
        navigate("/projects");
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <EmptyState
          title="Проект не найден"
          description="Проект был удалён или у вас нет доступа"
          action={
            <Button onClick={() => navigate("/projects")}>К проектам</Button>
          }
        />
      </div>
    );
  }

  const formattedDueDate = project.due_date
    ? new Date(project.due_date).toLocaleDateString("ru-RU")
    : null;

  const formattedStartDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString("ru-RU")
    : null;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link to="/projects" className="text-blue-600 hover:text-blue-700">
              Проекты
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{project.code}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {project.code}
              </span>
              <ProjectStatusBadge status={project.status} size="md" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-gray-600 mt-2">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Редактировать
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteProject.isPending}
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Удалить
            </Button>
          </div>
        </div>

        {/* Dates and Stats Row */}
        <div className="flex items-center gap-6 text-sm text-gray-600 border-t border-gray-100 pt-4">
          {formattedStartDate && (
            <div className="flex items-center gap-1.5">
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <span>Начало: {formattedStartDate}</span>
            </div>
          )}

          {formattedDueDate && (
            <div className="flex items-center gap-1.5">
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
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Дедлайн: {formattedDueDate}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
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
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <span>{project.stats.total_members} участников</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Прогресс проекта</span>
            <span className="text-sm font-medium text-gray-900">
              {project.stats.completion_percentage}%
            </span>
          </div>
          <Progress value={project.stats.completion_percentage} size="md" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Всего задач</div>
          <div className="text-2xl font-semibold text-gray-900">
            {project.stats.total_tasks}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Выполнено</div>
          <div className="text-2xl font-semibold text-green-600">
            {project.stats.completed_tasks}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Просрочено</div>
          <div className="text-2xl font-semibold text-red-600">
            {project.stats.overdue_tasks}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500 mb-1">Досок</div>
          <div className="text-2xl font-semibold text-gray-900">
            {project.stats.total_boards}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-4">
            <button
              onClick={() => setViewMode("tasks")}
              className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
                viewMode === "tasks"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Задачи ({project.stats.total_tasks})
            </button>
            <button
              onClick={() => setViewMode("boards")}
              className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
                viewMode === "boards"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Доски ({project.stats.total_boards})
            </button>
            <button
              onClick={() => setViewMode("members")}
              className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
                viewMode === "members"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Участники ({project.stats.total_members})
            </button>
          </nav>
        </div>

        {/* View Content */}
        <div className="p-6">
          {viewMode === "tasks" && (
            <div className="text-center py-8 text-gray-500">
              <p>Список задач проекта</p>
              <Link
                to={`/tasks?project_id=${projectId}`}
                className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
              >
                Открыть в разделе Задачи
              </Link>
            </div>
          )}

          {viewMode === "boards" && (
            <div className="text-center py-8 text-gray-500">
              <p>Доски проекта</p>
              <Link
                to={`/boards?project_id=${projectId}`}
                className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
              >
                Открыть в разделе Доски
              </Link>
            </div>
          )}

          {viewMode === "members" && (
            <div className="text-center py-8 text-gray-500">
              <p>Управление участниками будет реализовано</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
      />
    </div>
  );
}
