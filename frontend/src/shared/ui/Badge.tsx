import { cn } from "../lib/utils";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "status" | "priority" | "projectStatus";
  color?: string;
  size?: "sm" | "md";
  className?: string;
  // Alternative API for convenience
  type?: "status" | "priority" | "projectStatus";
  value?: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  new: "bg-blue-100 text-blue-700",
  assigned: "bg-purple-100 text-purple-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  in_review: "bg-amber-100 text-amber-700",
  rework: "bg-orange-100 text-orange-700",
  on_hold: "bg-gray-100 text-gray-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  draft: "Черновик",
  new: "Новая",
  assigned: "Назначена",
  in_progress: "В работе",
  in_review: "На проверке",
  rework: "На доработке",
  on_hold: "На паузе",
  done: "Готово",
  cancelled: "Отменена",
  pending: "В ожидании",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const priorityLabels: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
  urgent: "Срочный",
};

const projectStatusColors: Record<string, string> = {
  planning: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-gray-100 text-gray-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-gray-100 text-gray-500",
};

const projectStatusLabels: Record<string, string> = {
  planning: "Планирование",
  active: "Активный",
  on_hold: "На паузе",
  completed: "Завершён",
  archived: "Архив",
};

function Badge({
  children,
  variant = "default",
  color,
  size = "sm",
  className,
  type,
  value,
}: BadgeProps) {
  // Support alternative API: type + value
  const effectiveVariant = type || variant;
  const effectiveColor = value || color;

  const getColorClass = () => {
    if (effectiveColor) {
      if (effectiveVariant === "status") return statusColors[effectiveColor] || statusColors.draft;
      if (effectiveVariant === "priority")
        return priorityColors[effectiveColor] || priorityColors.medium;
      if (effectiveVariant === "projectStatus")
        return projectStatusColors[effectiveColor] || projectStatusColors.planning;
    }
    return "bg-gray-100 text-gray-700";
  };

  // Display text: use children or get Russian label
  const getLabel = (v: string) => {
    if (effectiveVariant === "status") return statusLabels[v] || v.replace(/_/g, " ");
    if (effectiveVariant === "priority") return priorityLabels[v] || v.replace(/_/g, " ");
    if (effectiveVariant === "projectStatus") return projectStatusLabels[v] || v.replace(/_/g, " ");
    return v.replace(/_/g, " ");
  };
  const displayText = children || (value ? getLabel(value) : "");

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        sizes[size],
        getColorClass(),
        className
      )}
    >
      {displayText}
    </span>
  );
}

export { Badge };
