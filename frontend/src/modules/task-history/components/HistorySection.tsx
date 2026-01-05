/**
 * SmartTask360 — History section for task detail page
 * Table format: Дата | Автор | Где изменилось | Изменение
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Spinner } from "../../../shared/ui";
import { useTaskHistory } from "../hooks/useTaskHistory";
import { getUserById, useUsersMap } from "../../users";
import { formatDateTime } from "../../../shared/lib/utils";
import type { TaskHistoryEntry } from "../types";

interface HistorySectionProps {
  taskId: string;
  /** When embedded in tabs, hide header and always show content */
  embedded?: boolean;
  /** Callback when comment link is clicked (to switch tabs) */
  onCommentLinkClick?: () => void;
}

// Translate action names
const actionLabels: Record<string, string> = {
  created: "Создание задачи",
  updated: "Обновление",
  status_changed: "Изменение статуса",
  assigned: "Назначение исполнителя",
  accepted: "Принятие задачи",
  rejected: "Отклонение задачи",
  completed: "Завершение",
  commented: "Комментарий",
  deleted: "Удаление",
};

// Translate field names
const fieldLabels: Record<string, string> = {
  title: "Название",
  description: "Описание",
  status: "Статус",
  priority: "Приоритет",
  assignee_id: "Исполнитель",
  creator_id: "Постановщик",
  due_date: "Срок",
  estimated_hours: "Оценка времени",
  project_id: "Проект",
};

// Status labels
const statusLabels: Record<string, string> = {
  draft: "Черновик",
  new: "Новая",
  assigned: "Назначена",
  in_progress: "В работе",
  on_hold: "На паузе",
  in_review: "На проверке",
  rework: "На доработке",
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

  // Handle JSONB wrapped values from backend
  let actualValue: unknown = value;

  // If it's an object, try to extract the actual value
  if (typeof value === "object" && value !== null) {
    // Check if it has a 'status' key (for status changes)
    if ("status" in value) {
      actualValue = (value as Record<string, unknown>).status;
    }
    // Check if it has a 'priority' key
    else if ("priority" in value) {
      actualValue = (value as Record<string, unknown>).priority;
    }
    // Check if it has a generic 'value' key
    else if ("value" in value) {
      actualValue = (value as Record<string, unknown>).value;
    }
  }

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

interface ChangeDescription {
  text: string;
  commentId?: string;
}

function getChangeDescription(entry: TaskHistoryEntry): ChangeDescription {
  if (entry.action === "created") {
    return { text: "Задача создана" };
  }

  if (entry.action === "commented" && entry.extra_data?.comment_id) {
    return {
      text: "Добавлен комментарий",
      commentId: entry.extra_data.comment_id as string,
    };
  }

  if (entry.action === "status_changed") {
    const oldStatus = formatValue("status", entry.old_value);
    const newStatus = formatValue("status", entry.new_value);
    return { text: `${oldStatus} → ${newStatus}` };
  }

  if (entry.field_name && entry.old_value !== null && entry.new_value !== null) {
    const oldVal = formatValue(entry.field_name, entry.old_value);
    const newVal = formatValue(entry.field_name, entry.new_value);
    return { text: `${oldVal} → ${newVal}` };
  }

  if (entry.field_name && entry.new_value !== null) {
    const newVal = formatValue(entry.field_name, entry.new_value);
    return { text: `Установлено: ${newVal}` };
  }

  return { text: actionLabels[entry.action] || entry.action };
}

function HistoryTable({
  history,
  onCommentLinkClick,
}: {
  history: TaskHistoryEntry[];
  onCommentLinkClick?: () => void;
}) {
  const { usersMap } = useUsersMap();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Дата
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Автор
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Где изменилось
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Изменение
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {history.map((entry) => {
            const changedBy = entry.changed_by_id ? getUserById(usersMap, entry.changed_by_id) : null;
            const fieldName = entry.field_name ? fieldLabels[entry.field_name] || entry.field_name : "—";
            const changeDescription = getChangeDescription(entry);

            return (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                  {formatDateTime(entry.created_at)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                  {changedBy?.name || "Система"}
                </td>
                <td className="px-3 py-2 text-gray-600">
                  {fieldName}
                </td>
                <td className="px-3 py-2 text-gray-900">
                  {changeDescription.commentId ? (
                    <a
                      href={`#comment-${changeDescription.commentId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        // Switch to comments tab first
                        if (onCommentLinkClick) {
                          onCommentLinkClick();
                        }
                        // Wait for tab switch and DOM update, then scroll
                        setTimeout(() => {
                          const commentElement = document.getElementById(`comment-${changeDescription.commentId}`);
                          if (commentElement) {
                            commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
                            commentElement.classList.add("bg-yellow-100");
                            setTimeout(() => {
                              commentElement.classList.remove("bg-yellow-100");
                            }, 2000);
                          }
                        }, 100);
                      }}
                    >
                      {changeDescription.text} →
                    </a>
                  ) : (
                    changeDescription.text
                  )}
                  {entry.comment && (
                    <div className="text-xs text-gray-500 mt-1 italic">
                      "{entry.comment}"
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function HistorySection({ taskId, embedded = false, onCommentLinkClick }: HistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: history = [], isLoading } = useTaskHistory(taskId);

  // Content to render (shared between embedded and card modes)
  const content = isLoading ? (
    <div className="flex justify-center py-4">
      <Spinner size="sm" />
    </div>
  ) : history.length > 0 ? (
    <HistoryTable history={history} onCommentLinkClick={onCommentLinkClick} />
  ) : (
    <p className="text-sm text-gray-400 italic py-2">История пуста</p>
  );

  // Embedded mode: no card wrapper, always visible
  if (embedded) {
    return <div className="p-4">{content}</div>;
  }

  // Card mode with collapsible header
  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <CardTitle>
              История {history.length > 0 && `(${history.length})`}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {content}
        </CardContent>
      )}
    </Card>
  );
}
