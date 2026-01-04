/**
 * SmartTask360 — Project status badge component
 */

import { cn } from "../../../shared/lib/utils";
import type { ProjectStatus } from "../types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; colorClass: string }
> = {
  planning: { label: "Планирование", colorClass: "bg-gray-100 text-gray-700" },
  active: { label: "Активный", colorClass: "bg-green-100 text-green-700" },
  on_hold: { label: "На паузе", colorClass: "bg-amber-100 text-amber-700" },
  completed: { label: "Завершён", colorClass: "bg-blue-100 text-blue-700" },
  archived: { label: "Архив", colorClass: "bg-gray-100 text-gray-500" },
};

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  size?: "sm" | "md";
}

export function ProjectStatusBadge({ status, size = "sm" }: ProjectStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, colorClass: "bg-gray-100 text-gray-700" };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        sizes[size],
        config.colorClass
      )}
    >
      {config.label}
    </span>
  );
}
