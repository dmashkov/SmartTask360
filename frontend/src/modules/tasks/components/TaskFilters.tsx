import { useState, useRef, useEffect, useMemo } from "react";
import { Input, Button, Checkbox, Modal, ModalHeader, ModalBody, ModalFooter } from "../../../shared/ui";
import type { TaskFilters as TaskFiltersType, TaskStatus, TaskPriority, TaskRoleFilter } from "../types";
import { useExportTasks } from "../hooks";
import { ImportTasksModal } from "./ImportTasksModal";
import { useUsers } from "../../users";
import { useAuth } from "../../auth";
import { SavedViewsDropdown } from "../../views";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Column visibility configuration
export interface ColumnConfig {
  id: boolean;
  title: boolean;
  author: boolean;
  creator: boolean;
  assignee: boolean;
  dueDate: boolean;
  priority: boolean;
  status: boolean;
  createdAt: boolean;
}

export const defaultColumnConfig: ColumnConfig = {
  id: true,
  title: true,
  author: false,
  creator: false,
  assignee: true,
  dueDate: true,
  priority: true,
  status: true,
  createdAt: true,
};

const columnLabels: Record<keyof ColumnConfig, string> = {
  id: "ID",
  title: "Наименование",
  author: "Автор",
  creator: "Постановщик",
  assignee: "Исполнитель",
  dueDate: "Срок",
  priority: "Приоритет",
  status: "Статус",
  createdAt: "Создана",
};

const columnOrder: Array<keyof ColumnConfig> = [
  "id",
  "title",
  "author",
  "creator",
  "assignee",
  "dueDate",
  "priority",
  "status",
  "createdAt",
];

// Status options with labels
const allStatuses: { value: TaskStatus; label: string }[] = [
  { value: "new", label: "Новая" },
  { value: "assigned", label: "Назначена" },
  { value: "in_progress", label: "В работе" },
  { value: "in_review", label: "На проверке" },
  { value: "on_hold", label: "На паузе" },
  { value: "done", label: "Готово" },
  { value: "cancelled", label: "Отменена" },
];

// "Done" and "cancelled" are considered completed
const completedStatuses: TaskStatus[] = ["done", "cancelled"];
const activeStatuses: TaskStatus[] = ["new", "assigned", "in_progress", "in_review", "on_hold"];

// Priority options
const priorityOptions = [
  { value: "", label: "Все приоритеты" },
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критический" },
];

// Role filter options
const roleOptions: { value: TaskRoleFilter; label: string }[] = [
  { value: "all", label: "Все задачи" },
  { value: "assignee", label: "Мне" },
  { value: "creator", label: "Мои" },
  { value: "watcher", label: "Слежу" },
];

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  columnConfig: ColumnConfig;
  onColumnConfigChange: (config: ColumnConfig) => void;
}

export function TaskFilters({ filters, onFiltersChange, columnConfig, onColumnConfigChange }: TaskFiltersProps) {
  const { user: currentUser } = useAuth();
  const { data: users = [] } = useUsers();

  const [search, setSearch] = useState(filters.search || "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [tempColumnConfig, setTempColumnConfig] = useState<ColumnConfig>(columnConfig);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const exportTasks = useExportTasks();

  // Debounce search input (300ms delay)
  const debouncedSearch = useDebounce(search, 300);

  // Get current selected statuses as array
  const selectedStatuses: TaskStatus[] = useMemo(() => {
    if (!filters.status) return [];
    return Array.isArray(filters.status) ? filters.status : [filters.status];
  }, [filters.status]);

  // Check if "hide completed" is active (no done/cancelled in selected)
  const hideCompleted = useMemo(() => {
    if (selectedStatuses.length === 0) return false;
    return !selectedStatuses.some(s => completedStatuses.includes(s));
  }, [selectedStatuses]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync search from filters
  useEffect(() => {
    if (filters.search !== undefined && filters.search !== search) {
      setSearch(filters.search);
    }
  }, [filters.search]);

  // Apply debounced search to filters
  useEffect(() => {
    const currentSearch = filters.search || "";
    const shouldSearch = debouncedSearch === "" || debouncedSearch.length >= 3;
    if (shouldSearch && debouncedSearch !== currentSearch) {
      onFiltersChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  // Reset temp config when modal opens
  useEffect(() => {
    if (isColumnModalOpen) {
      setTempColumnConfig(columnConfig);
    }
  }, [isColumnModalOpen, columnConfig]);

  const handleColumnToggle = (column: keyof ColumnConfig) => {
    if (column === "title") return;
    setTempColumnConfig((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleSaveColumns = () => {
    onColumnConfigChange(tempColumnConfig);
    setIsColumnModalOpen(false);
  };

  const handleCancelColumns = () => {
    setTempColumnConfig(columnConfig);
    setIsColumnModalOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Status multi-select handlers
  const handleStatusToggle = (status: TaskStatus) => {
    let newStatuses: TaskStatus[];
    if (selectedStatuses.includes(status)) {
      newStatuses = selectedStatuses.filter(s => s !== status);
    } else {
      newStatuses = [...selectedStatuses, status];
    }

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleHideCompletedToggle = () => {
    if (hideCompleted) {
      // Show all statuses (clear filter)
      onFiltersChange({ ...filters, status: undefined });
    } else {
      // Hide completed - only show active statuses
      onFiltersChange({ ...filters, status: activeStatuses });
    }
  };

  const handleOverdueToggle = () => {
    onFiltersChange({
      ...filters,
      is_overdue: filters.is_overdue ? undefined : true,
    });
  };

  const handleRoleChange = (role: TaskRoleFilter) => {
    if (!currentUser) return;

    let newFilters: TaskFiltersType = { ...filters };

    // Clear previous role-related filters
    delete newFilters.assignee_id;
    delete newFilters.creator_id;
    delete newFilters.role;

    if (role === "all") {
      // No additional filters
    } else if (role === "assignee") {
      newFilters.assignee_id = currentUser.id;
    } else if (role === "creator") {
      newFilters.creator_id = currentUser.id;
    } else if (role === "watcher") {
      // TODO: This needs a different API endpoint or filter
      // For now, we'll just set a role marker
      newFilters.role = "watcher";
    }

    onFiltersChange(newFilters);
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      assignee_id: value || undefined,
      role: undefined, // Clear role when manually selecting user
    });
  };

  const handleCreatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      creator_id: value || undefined,
      role: undefined, // Clear role when manually selecting user
    });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TaskPriority | "";
    onFiltersChange({ ...filters, priority: value || undefined });
  };

  const handleClearFilters = () => {
    setSearch("");
    onFiltersChange({});
  };

  const openColumnSettings = () => {
    setIsMenuOpen(false);
    setIsColumnModalOpen(true);
  };

  const handleExport = () => {
    setIsMenuOpen(false);
    exportTasks.mutate(filters);
  };

  const handleOpenImport = () => {
    setIsMenuOpen(false);
    setIsImportModalOpen(true);
  };

  // Determine current role from filters
  const currentRole: TaskRoleFilter = useMemo(() => {
    if (filters.role === "watcher") return "watcher";
    if (filters.assignee_id === currentUser?.id && !filters.creator_id) return "assignee";
    if (filters.creator_id === currentUser?.id && !filters.assignee_id) return "creator";
    return "all";
  }, [filters, currentUser]);

  const hasFilters = filters.status || filters.priority || filters.search ||
    filters.assignee_id || filters.creator_id || filters.is_overdue;

  const activeFiltersCount = [
    filters.status,
    filters.priority,
    filters.search,
    filters.assignee_id,
    filters.creator_id,
    filters.is_overdue,
  ].filter(Boolean).length;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        {/* Row 1: Search + Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <Input
              placeholder="Поиск задач (мин. 3 символа)..."
              value={search}
              onChange={handleSearchChange}
              leftIcon={
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              }
            />
          </form>

          <div className="flex gap-2 items-center">
            {/* Role quick filter */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    currentRole === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } ${option.value !== "all" ? "border-l border-gray-200" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Expand filters button */}
            <Button
              variant="outline"
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              className="relative"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Фильтры
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {/* Saved Views */}
            <SavedViewsDropdown
              currentFilters={filters}
              onApplyView={onFiltersChange}
            />

            {hasFilters && (
              <Button variant="ghost" onClick={handleClearFilters} className="text-gray-500">
                Сбросить
              </Button>
            )}

            {/* Settings menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Настройки таблицы"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                  <button
                    type="button"
                    onClick={openColumnSettings}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
                    </svg>
                    Настройка колонок
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenImport}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Импорт из Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exportTasks.isPending}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {exportTasks.isPending ? "Экспорт..." : "Экспорт в Excel"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Expanded Filters */}
        {isFiltersExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status multi-select dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <span className={selectedStatuses.length > 0 ? "text-gray-900" : "text-gray-500"}>
                      {selectedStatuses.length === 0
                        ? "Все статусы"
                        : selectedStatuses.length === 1
                        ? allStatuses.find(s => s.value === selectedStatuses[0])?.label
                        : `Выбрано: ${selectedStatuses.length}`}
                    </span>
                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {isStatusDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg py-1">
                      {allStatuses.map((status) => (
                        <label
                          key={status.value}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedStatuses.includes(status.value)}
                            onChange={() => handleStatusToggle(status.value)}
                          />
                          <span className="text-sm text-gray-700">{status.label}</span>
                        </label>
                      ))}
                      {selectedStatuses.length > 0 && (
                        <>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              onFiltersChange({ ...filters, status: undefined });
                              setIsStatusDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-50"
                          >
                            Сбросить выбор
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignee select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Исполнитель</label>
                <select
                  value={filters.assignee_id || ""}
                  onChange={handleAssigneeChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Все исполнители</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Creator select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Постановщик</label>
                <select
                  value={filters.creator_id || ""}
                  onChange={handleCreatorChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Все постановщики</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
                <select
                  value={Array.isArray(filters.priority) ? "" : (filters.priority || "")}
                  onChange={handlePriorityChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional toggles */}
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={hideCompleted}
                  onChange={handleHideCompletedToggle}
                />
                <span className="text-sm text-gray-700">Скрыть завершенные</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.is_overdue || false}
                  onChange={handleOverdueToggle}
                />
                <span className="text-sm text-gray-700">Только просроченные</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Column Settings Modal */}
      <Modal isOpen={isColumnModalOpen} onClose={handleCancelColumns} size="sm">
        <ModalHeader onClose={handleCancelColumns}>Настройка колонок таблицы</ModalHeader>
        <ModalBody>
          <div className="space-y-2">
            {columnOrder.map((column) => (
              <label
                key={column}
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer ${
                  column === "title" ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Checkbox
                  checked={tempColumnConfig[column]}
                  onChange={() => handleColumnToggle(column)}
                  disabled={column === "title"}
                />
                <span className="text-sm text-gray-700">{columnLabels[column]}</span>
              </label>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={handleCancelColumns}>
            Отмена
          </Button>
          <Button onClick={handleSaveColumns}>
            Сохранить
          </Button>
        </ModalFooter>
      </Modal>

      {/* Import Tasks Modal */}
      <ImportTasksModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </>
  );
}
