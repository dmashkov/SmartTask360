import { useState } from "react";
import { Input, Select, Button } from "../../../shared/ui";
import type { TaskFilters as TaskFiltersType, TaskStatus, TaskPriority } from "../types";

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
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: search || undefined });
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

  const hasFilters = filters.status || filters.priority || filters.search;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <Input
            placeholder="Поиск задач..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        </div>
      </div>
    </div>
  );
}
