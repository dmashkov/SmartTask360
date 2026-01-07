/**
 * SmartTask360 — Kanban Board Filters
 * Provides search and filtering for tasks on Kanban board
 */

import { useState, useEffect, useMemo } from "react";
import { Input, Button } from "../../../shared/ui";
import type { KanbanFilters as KanbanFiltersType } from "../types";
import { useUsers } from "../../users";
import { TagsSelect } from "../../tags";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface KanbanFiltersProps {
  filters: KanbanFiltersType;
  onFiltersChange: (filters: KanbanFiltersType) => void;
}

// Priority options
const PRIORITY_OPTIONS = [
  { value: "", label: "Все приоритеты" },
  { value: "critical", label: "Критический" },
  { value: "high", label: "Высокий" },
  { value: "medium", label: "Средний" },
  { value: "low", label: "Низкий" },
];

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: users = [] } = useUsers();

  // Apply debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]);

  const handlePriorityChange = (priority: string) => {
    onFiltersChange({ ...filters, priority: priority || undefined });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    onFiltersChange({ ...filters, assignee_id: assigneeId || undefined });
  };

  const handleTagsChange = (tagIds: string[]) => {
    onFiltersChange({
      ...filters,
      tag_ids: tagIds.length > 0 ? tagIds : undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    onFiltersChange({});
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return [
      filters.search,
      filters.priority,
      filters.assignee_id,
      filters.tag_ids && filters.tag_ids.length > 0,
    ].filter(Boolean).length;
  }, [filters]);

  const hasFilters = activeFiltersCount > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 max-w-xs">
          <Input
            type="text"
            placeholder="Поиск задач..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          <svg
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Clear filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Сбросить
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select
                value={filters.priority || ""}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full h-9 px-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Исполнитель
              </label>
              <select
                value={filters.assignee_id || ""}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full h-9 px-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все исполнители</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Теги
              </label>
              <TagsSelect
                value={filters.tag_ids || []}
                onChange={handleTagsChange}
                placeholder="Фильтр по тегам..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
