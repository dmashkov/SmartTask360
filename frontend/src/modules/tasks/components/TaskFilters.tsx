import { useState, useRef, useEffect } from "react";
import { Input, Select, Button, Checkbox, Modal, ModalHeader, ModalBody, ModalFooter } from "../../../shared/ui";
import type { TaskFilters as TaskFiltersType, TaskStatus, TaskPriority } from "../types";
import { useExportTasks } from "../hooks";
import { ImportTasksModal } from "./ImportTasksModal";

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
  author: boolean;      // who physically created (immutable)
  creator: boolean;     // on whose behalf (can be changed)
  assignee: boolean;    // who will execute
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

// Order of columns in the modal
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

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "new", label: "Новая" },
  { value: "assigned", label: "Назначена" },
  { value: "in_progress", label: "В работе" },
  { value: "in_review", label: "На проверке" },
  { value: "on_hold", label: "На паузе" },
  { value: "done", label: "Готово" },
  { value: "cancelled", label: "Отменена" },
];

const priorityOptions = [
  { value: "", label: "Все приоритеты" },
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критический" },
];

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  columnConfig: ColumnConfig;
  onColumnConfigChange: (config: ColumnConfig) => void;
}

export function TaskFilters({ filters, onFiltersChange, columnConfig, onColumnConfigChange }: TaskFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [tempColumnConfig, setTempColumnConfig] = useState<ColumnConfig>(columnConfig);
  const menuRef = useRef<HTMLDivElement>(null);

  const exportTasks = useExportTasks();

  // Debounce search input (300ms delay)
  const debouncedSearch = useDebounce(search, 300);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync search from filters (for global search)
  useEffect(() => {
    if (filters.search !== undefined && filters.search !== search) {
      setSearch(filters.search);
    }
  }, [filters.search]);

  // Apply debounced search to filters (min 3 characters or empty)
  useEffect(() => {
    const currentSearch = filters.search || "";
    // Only search if: empty (clear filter) or at least 3 characters
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
    // Don't allow hiding title column
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
    // Immediately apply search on form submit (Enter key)
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TaskStatus | "";
    onFiltersChange({ ...filters, status: value || undefined });
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

  const hasFilters = filters.status || filters.priority || filters.search;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
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

          <div className="flex gap-2">
            <Select
              options={statusOptions}
              value={filters.status || ""}
              onChange={handleStatusChange}
              className="w-40"
            />

            <Select
              options={priorityOptions}
              value={filters.priority || ""}
              onChange={handlePriorityChange}
              className="w-40"
            />

            {hasFilters && (
              <Button variant="ghost" onClick={handleClearFilters}>
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
