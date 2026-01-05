/**
 * SmartTask360 — Projects list page
 */

import { useState, useEffect, useRef } from "react";
import { Button, Input, Select, EmptyState, Spinner, Card } from "../shared/ui";
import {
  useProjects,
  ProjectCard,
  ProjectRow,
  ProjectTableHeader,
  ProjectFormModal,
  type ProjectStatus,
  type ProjectFilters,
} from "../modules/projects";

type ViewMode = "cards" | "list";
const VIEW_MODE_KEY = "smarttask360_projects_view";
const FILTERS_KEY = "smarttask360_projects_filters";

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "planning", label: "Планирование" },
  { value: "active", label: "Активный" },
  { value: "on_hold", label: "На паузе" },
  { value: "completed", label: "Завершён" },
  { value: "archived", label: "Архив" },
];

// Load saved filters from localStorage
function loadSavedFilters(): ProjectFilters {
  try {
    const saved = localStorage.getItem(FILTERS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return { my_projects: true, include_archived: false };
}

export function ProjectsPage() {
  const [filters, setFilters] = useState<ProjectFilters>(loadSavedFilters);
  const [search, setSearch] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as ViewMode) || "cards";
  });
  const settingsRef = useRef<HTMLDivElement>(null);

  const { data: projects = [], isLoading } = useProjects({
    ...filters,
    search: search.length >= 2 ? search : undefined,
  });

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  // Close settings menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setIsSettingsOpen(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Проекты</h1>
        <div className="flex items-center gap-2">
          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Настройки отображения"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                  Тип отображения
                </div>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("cards")}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    viewMode === "cards"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  Карточки
                  {viewMode === "cards" && (
                    <svg className="h-4 w-4 ml-auto text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("list")}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                    viewMode === "list"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  Список
                  {viewMode === "list" && (
                    <svg className="h-4 w-4 ml-auto text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>

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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Search - expands to fill available space */}
          <div className="flex-1 min-w-0">
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

          {/* Filters - pushed to the right */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.my_projects}
                onChange={handleToggleMyProjects}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Мои проекты
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={filters.include_archived}
                onChange={handleToggleArchived}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Архивные
            </label>

            <Select
              options={statusOptions}
              value={filters.status || ""}
              onChange={handleStatusChange}
              className="w-44"
            />
          </div>
        </div>
      </div>

      {/* Projects */}
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
      ) : viewMode === "cards" ? (
        // Cards view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        // List view
        <Card className="overflow-hidden">
          <ProjectTableHeader />
          <div>
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </Card>
      )}

      {/* Footer with count */}
      {projects.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Всего: {projects.length} проектов
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
