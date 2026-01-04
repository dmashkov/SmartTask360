/**
 * SmartTask360 — Projects list page
 */

import { useState } from "react";
import { Button, Input, Select, EmptyState, Spinner } from "../shared/ui";
import {
  useProjects,
  ProjectCard,
  ProjectFormModal,
  type ProjectStatus,
  type ProjectFilters,
} from "../modules/projects";

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "planning", label: "Планирование" },
  { value: "active", label: "Активный" },
  { value: "on_hold", label: "На паузе" },
  { value: "completed", label: "Завершён" },
  { value: "archived", label: "Архив" },
];

export function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>({
    my_projects: true,
    include_archived: false,
  });
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: projects = [], isLoading } = useProjects({
    ...filters,
    search: search.length >= 2 ? search : undefined,
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as ProjectStatus | "";
    setFilters((prev) => ({
      ...prev,
      status: value || undefined,
    }));
  };

  const handleToggleMyProjects = () => {
    setFilters((prev) => ({
      ...prev,
      my_projects: !prev.my_projects,
    }));
  };

  const handleToggleArchived = () => {
    setFilters((prev) => ({
      ...prev,
      include_archived: !prev.include_archived,
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Проекты</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Создать проект
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Поиск проектов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
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
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              }
            />
          </div>

          <Select
            options={statusOptions}
            value={filters.status || ""}
            onChange={handleStatusChange}
            className="w-44"
          />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.my_projects}
                onChange={handleToggleMyProjects}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Мои проекты
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.include_archived}
                onChange={handleToggleArchived}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Архивные
            </label>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Нет проектов"
          description={
            search || filters.status
              ? "Попробуйте изменить параметры поиска"
              : "Создайте первый проект для начала работы"
          }
          action={
            !search && !filters.status ? (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Создать проект
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ProjectFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
