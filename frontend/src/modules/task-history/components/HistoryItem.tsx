/**
 * SmartTask360 — Single history entry
 */

import { formatDateTime } from "../../../shared/lib/utils";
import { getUserById, useUsersMap } from "../../users";
import type { TaskHistoryEntry } from "../types";

interface HistoryItemProps {
  entry: TaskHistoryEntry;
}

// Translate action names
const actionLabels: Record<string, string> = {
  created: "создал(а) задачу",
  updated: "изменил(а)",
  status_changed: "изменил(а) статус",
  assigned: "назначил(а) исполнителя",
  accepted: "принял(а) задачу",
  rejected: "отклонил(а) задачу",
  completed: "завершил(а) задачу",
  commented: "добавил(а) комментарий",
  deleted: "удалил(а)",
};

// Translate field names
const fieldLabels: Record<string, string> = {
  title: "название",
  description: "описание",
  status: "статус",
  priority: "приоритет",
  assignee_id: "исполнитель",
  creator_id: "постановщик",
  due_date: "срок",
  estimated_hours: "оценка времени",
  project_id: "проект",
};

// Status labels
const statusLabels: Record<string, string> = {
  draft: "Черновик",
  new: "Новая",
  assigned: "Назначена",
  in_progress: "В работе",
  on_hold: "На паузе",
  in_review: "На проверке",
  done: "Готово",
  cancelled: "Отменена",
};

// Priority labels
const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

function formatValue(fieldName: string | null, value: unknown): string {
  if (value === null || value === undefined) return "—";

  // Handle JSON wrapped values
  const actualValue = typeof value === "object" && value !== null && "value" in value
    ? (value as { value: unknown }).value
    : value;

  if (actualValue === null || actualValue === undefined) return "—";

  if (fieldName === "status") {
    return statusLabels[String(actualValue)] || String(actualValue);
  }
  if (fieldName === "priority") {
    return priorityLabels[String(actualValue)] || String(actualValue);
  }
  if (fieldName === "due_date" && actualValue) {
    return new Date(String(actualValue)).toLocaleDateString("ru-RU");
  }

  return String(actualValue);
}

export function HistoryItem({ entry }: HistoryItemProps) {
  const { usersMap } = useUsersMap();
  const changedBy = entry.changed_by_id ? getUserById(usersMap, entry.changed_by_id) : null;

  const actionText = actionLabels[entry.action] || entry.action;
  const fieldText = entry.field_name ? fieldLabels[entry.field_name] || entry.field_name : "";

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Timeline dot */}
      <div className="shrink-0 mt-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          <span className="font-medium">{changedBy?.name || "Система"}</span>
          {" "}
          {actionText}
          {fieldText && (
            <>
              {" "}
              <span className="text-gray-500">{fieldText}</span>
            </>
          )}
          {entry.old_value !== null && entry.new_value !== null && entry.field_name && (
            <>
              {" с "}
              <span className="text-gray-500 line-through">
                {formatValue(entry.field_name, entry.old_value)}
              </span>
              {" на "}
              <span className="font-medium">
                {formatValue(entry.field_name, entry.new_value)}
              </span>
            </>
          )}
        </p>
        {entry.comment && (
          <p className="text-sm text-gray-500 mt-0.5 italic">"{entry.comment}"</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDateTime(entry.created_at)}
        </p>
      </div>
    </div>
  );
}
