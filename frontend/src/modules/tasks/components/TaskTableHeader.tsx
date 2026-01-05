import { cn } from "../../../shared/lib/utils";
import type { ColumnConfig } from "./TaskFilters";

export type SortField = "title" | "priority" | "status" | "due_date" | "created_at";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

interface TaskTableHeaderProps {
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  columnConfig: ColumnConfig;
}

interface HeaderCellProps {
  field: SortField;
  label: string;
  currentSort: SortConfig;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  return (
    <span className={cn("ml-1 inline-flex", active ? "text-blue-600" : "text-gray-400")}>
      {active ? (
        order === "asc" ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        )
      ) : (
        <svg className="h-4 w-4 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
      )}
    </span>
  );
}

function HeaderCell({ field, label, currentSort, onSort, className }: HeaderCellProps) {
  const isActive = currentSort.field === field;

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "group flex items-center text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
        "hover:text-gray-700 transition-colors",
        isActive && "text-blue-600",
        className
      )}
    >
      {label}
      <SortIcon active={isActive} order={currentSort.order} />
    </button>
  );
}

export function TaskTableHeader({ sort, onSortChange, columnConfig }: TaskTableHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-3 px-3 py-1.5">
        {/* Expand button + Checkbox placeholder (matches TaskRow) */}
        <div className="flex items-center gap-1">
          <div className="w-4" />
          <div className="w-4" />
        </div>

        {/* ID */}
        {columnConfig.id && (
          <div className="w-16 shrink-0 text-left">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</span>
          </div>
        )}

        {/* Title - always visible */}
        <div className="flex-1 min-w-0">
          <HeaderCell
            field="title"
            label="Название"
            currentSort={sort}
            onSort={onSortChange}
          />
        </div>

        {/* Author - who physically created */}
        {columnConfig.author && (
          <div className="w-24 shrink-0 text-left">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Автор</span>
          </div>
        )}

        {/* Creator - on whose behalf */}
        {columnConfig.creator && (
          <div className="w-24 shrink-0 text-left">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Постановщик</span>
          </div>
        )}

        {/* Assignee - who will execute */}
        {columnConfig.assignee && (
          <div className="w-24 shrink-0 text-left">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Исполнитель</span>
          </div>
        )}

        {/* Due Date */}
        {columnConfig.dueDate && (
          <div className="w-32 text-left">
            <HeaderCell
              field="due_date"
              label="Срок"
              currentSort={sort}
              onSort={onSortChange}
            />
          </div>
        )}

        {/* Priority */}
        {columnConfig.priority && (
          <div className="w-20 text-left">
            <HeaderCell
              field="priority"
              label="Приоритет"
              currentSort={sort}
              onSort={onSortChange}
            />
          </div>
        )}

        {/* Status */}
        {columnConfig.status && (
          <div className="w-24 text-left">
            <HeaderCell
              field="status"
              label="Статус"
              currentSort={sort}
              onSort={onSortChange}
            />
          </div>
        )}

        {/* Created */}
        {columnConfig.createdAt && (
          <div className="w-28 text-left">
            <HeaderCell
              field="created_at"
              label="Создана"
              currentSort={sort}
              onSort={onSortChange}
            />
          </div>
        )}

        {/* Actions placeholder */}
        <div className="w-5" />
      </div>
    </div>
  );
}
