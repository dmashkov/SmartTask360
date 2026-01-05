import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse date string from backend (naive datetime stored as UTC)
 * Backend stores timestamps in UTC without timezone marker
 */
function parseBackendDate(date: Date | string): Date {
  if (typeof date !== "string") return date;

  // Backend returns UTC timestamps without 'Z' marker
  // Add 'Z' to parse as UTC, which will then display in local timezone
  if (!date.includes("Z") && !date.includes("+")) {
    return new Date(date + "Z");
  }
  return new Date(date);
}

/**
 * Format date to Russian locale
 * Handles dates from backend (naive datetime stored as UTC)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = parseBackendDate(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = parseBackendDate(date);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format relative time (e.g., "5 минут назад")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = parseBackendDate(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;

  return formatDate(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Status labels in Russian
 */
export const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  new: "Новая",
  assigned: "Назначена",
  in_progress: "В работе",
  in_review: "На проверке",
  on_hold: "На паузе",
  done: "Готово",
  cancelled: "Отменена",
};

/**
 * Priority labels in Russian
 */
export const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] || priority;
}

/**
 * Get short ID from UUID (first 8 characters)
 */
export function getShortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}

/**
 * Highlight search text in a string
 * Returns an array of parts with highlight flags for React rendering
 */
export interface HighlightPart {
  text: string;
  isHighlight: boolean;
}

export function getHighlightParts(text: string, searchQuery: string): HighlightPart[] {
  if (!searchQuery || searchQuery.length < 3) {
    return [{ text, isHighlight: false }];
  }

  const parts: HighlightPart[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, index),
        isHighlight: false,
      });
    }

    // Add matched text
    parts.push({
      text: text.slice(index, index + searchQuery.length),
      isHighlight: true,
    });

    lastIndex = index + searchQuery.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isHighlight: false,
    });
  }

  return parts.length > 0 ? parts : [{ text, isHighlight: false }];
}

/**
 * Copy text to clipboard and return success status
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Get full URL for a task
 */
export function getTaskUrl(taskId: string): string {
  return `${window.location.origin}/tasks/${taskId}`;
}

/**
 * Task urgency status type
 */
export type TaskUrgencyStatus = "overdue" | "due_today" | "due_soon" | "on_track" | "completed";

export interface TaskUrgency {
  status: TaskUrgencyStatus;
  label: string | null;
  tooltip: string | null;
  colorClass: string | null;
  icon: string | null;
  daysLeft: number | null;
}

/**
 * Get task urgency status based on due date
 */
export function getTaskUrgency(task: { status: string; due_date: string | null; completed_at: string | null }): TaskUrgency {
  // Completed tasks
  if (task.status === "done") {
    if (!task.due_date) {
      return {
        status: "completed",
        label: null,
        tooltip: null,
        colorClass: null,
        icon: null,
        daysLeft: null,
      };
    }

    const completedDate = task.completed_at ? parseBackendDate(task.completed_at) : new Date();
    const dueDate = parseBackendDate(task.due_date);
    const daysLate = Math.ceil((completedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLate > 0) {
      const weeksLate = Math.floor(daysLate / 7);
      const tooltip = weeksLate > 0
        ? `Просрочена на ${weeksLate} ${weeksLate === 1 ? 'неделю' : weeksLate < 5 ? 'недели' : 'недель'}`
        : `Просрочена на ${daysLate} ${daysLate === 1 ? 'день' : daysLate < 5 ? 'дня' : 'дней'}`;

      return {
        status: "overdue",
        label: "Просрочена",
        tooltip,
        colorClass: "bg-gray-100 text-gray-600",
        icon: "⚠",
        daysLeft: -daysLate,
      };
    }

    return {
      status: "completed",
      label: null,
      tooltip: null,
      colorClass: null,
      icon: null,
      daysLeft: null,
    };
  }

  // No due date
  if (!task.due_date) {
    return {
      status: "on_track",
      label: null,
      tooltip: null,
      colorClass: null,
      icon: null,
      daysLeft: null,
    };
  }

  // Calculate days left
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Start of today
  const dueDate = parseBackendDate(task.due_date);
  dueDate.setHours(0, 0, 0, 0); // Start of due date
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Overdue
  if (daysLeft < 0) {
    const daysOverdue = Math.abs(daysLeft);
    const weeksOverdue = Math.floor(daysOverdue / 7);
    const tooltip = weeksOverdue > 0
      ? `Просрочена на ${weeksOverdue} ${weeksOverdue === 1 ? 'неделю' : weeksOverdue < 5 ? 'недели' : 'недель'}`
      : `Просрочена на ${daysOverdue} ${daysOverdue === 1 ? 'день' : daysOverdue < 5 ? 'дня' : 'дней'}`;

    return {
      status: "overdue",
      label: "Просрочена",
      tooltip,
      colorClass: "bg-red-100 text-red-700",
      icon: "🔴",
      daysLeft,
    };
  }

  // Due today
  if (daysLeft === 0) {
    return {
      status: "due_today",
      label: "Срок сегодня",
      tooltip: "Задача должна быть завершена сегодня",
      colorClass: "bg-orange-100 text-orange-700",
      icon: "🟠",
      daysLeft: 0,
    };
  }

  // Due soon (1-3 days)
  if (daysLeft <= 3) {
    const tooltip = `Осталось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}`;
    return {
      status: "due_soon",
      label: `${daysLeft} дн.`,
      tooltip,
      colorClass: "bg-yellow-100 text-yellow-700",
      icon: "🟡",
      daysLeft,
    };
  }

  // On track
  return {
    status: "on_track",
    label: null,
    tooltip: null,
    colorClass: null,
    icon: null,
    daysLeft,
  };
}
