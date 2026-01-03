import { cn } from "../../../shared/lib/utils";

export type SortField = "title" | "priority" | "status" | "due_date" | "created_at";
export type SortOrder = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

interface TaskTableHeaderProps {
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
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

export function TaskTableHeader({ sort, onSortChange }: TaskTableHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Checkbox placeholder */}
        <div className="w-5" />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <HeaderCell
            field="title"
            label="Название"
            currentSort={sort}
            onSort={onSortChange}
          />
        </div>

        {/* Due Date */}
        <div className="w-28">
          <HeaderCell
            field="due_date"
            label="Срок"
            currentSort={sort}
            onSort={onSortChange}
          />
        </div>

        {/* Priority */}
        <div className="w-24">
          <HeaderCell
            field="priority"
            label="Приоритет"
            currentSort={sort}
            onSort={onSortChange}
          />
        </div>

        {/* Status */}
        <div className="w-28">
          <HeaderCell
            field="status"
            label="Статус"
            currentSort={sort}
            onSort={onSortChange}
          />
        </div>

        {/* Created */}
        <div className="w-32">
          <HeaderCell
            field="created_at"
            label="Создана"
            currentSort={sort}
            onSort={onSortChange}
          />
        </div>

        {/* Assignee placeholder */}
        <div className="w-8" />

        {/* Actions placeholder */}
        <div className="w-6" />
      </div>
    </div>
  );
}
