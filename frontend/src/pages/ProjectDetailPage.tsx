/**
 * SmartTask360 — Project detail page
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
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
  ProjectTasksTab,
  ProjectBoardsTab,
  ProjectMembersTab,
} from "../modules/projects";
import { useAuth } from "../modules/auth";
import { TaskFormModal } from "../modules/tasks";

type ViewMode = "tasks" | "kanban" | "members";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: project, isLoading, error } = useProject(projectId || "");
  const deleteProject = useDeleteProject();

  // Check if current user is owner
  const isOwner = user?.id === project?.owner_id;

  // Get initial view mode from URL, default to "tasks"
  const initialViewMode = (searchParams.get("view") as ViewMode) || "tasks";
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

  // Update URL when view mode changes
  useEffect(() => {
    setSearchParams({ view: viewMode }, { replace: true });
  }, [viewMode, setSearchParams]);

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
      <nav className="mb-3">
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

      {/* Compact Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {/* Top row: Title + Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded shrink-0">
              {project.code}
            </span>
            <ProjectStatusBadge status={project.status} size="sm" />
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Редактировать
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteProject.isPending}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Удалить
            </Button>
          </div>
        </div>

        {/* Description (optional, collapsible) */}
        {project.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-1" title={project.description}>
            {project.description}
          </p>
        )}

        {/* Bottom row: Dates + Stats + Progress */}
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {/* Dates */}
          <div className="flex items-center gap-4">
            {formattedStartDate && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {formattedStartDate}
              </span>
            )}
            {formattedDueDate && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formattedDueDate}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-200" />

          {/* Stats inline */}
          <div className="flex items-center gap-4">
            <span>
              <span className="font-medium text-gray-700">{project.stats.total_tasks}</span> задач
            </span>
            <span>
              <span className="font-medium text-green-600">{project.stats.completed_tasks}</span> готово
            </span>
            {project.stats.overdue_tasks > 0 && (
              <span>
                <span className="font-medium text-red-600">{project.stats.overdue_tasks}</span> просрочено
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-gray-200" />

          {/* Progress */}
          <div className="flex items-center gap-2 flex-1">
            <span className="shrink-0">Прогресс:</span>
            <div className="flex-1 max-w-[200px]">
              <Progress value={project.stats.completion_percentage} size="sm" />
            </div>
            <span className="font-medium text-gray-700 shrink-0">{project.stats.completion_percentage}%</span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex items-center justify-between px-4">
            <div className="flex gap-4">
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
              onClick={() => setViewMode("kanban")}
              className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors ${
                viewMode === "kanban"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Канбан
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
            </div>
            {/* Create Task Button */}
            {(viewMode === "tasks" || viewMode === "kanban") && (
              <Button
                size="sm"
                onClick={() => setIsCreateTaskModalOpen(true)}
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Создать задачу
              </Button>
            )}
          </nav>
        </div>

        {/* View Content */}
        <div>
          {viewMode === "tasks" && projectId && (
            <ProjectTasksTab projectId={projectId} />
          )}

          {viewMode === "kanban" && projectId && (
            <ProjectBoardsTab projectId={projectId} />
          )}

          {viewMode === "members" && projectId && (
            <ProjectMembersTab projectId={projectId} isOwner={isOwner} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
      />

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        defaultProjectId={projectId}
      />
    </div>
  );
}
