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
