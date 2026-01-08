/**
 * Gantt Task Row Component
 *
 * Renders a single task bar in the Gantt chart.
 * Supports:
 * - Regular tasks (bars)
 * - Milestones (diamonds)
 * - Progress indicator
 * - Critical path highlighting
 * - Status-based coloring
 */

import { useMemo } from "react";
import type { GanttTaskData } from "../types";

interface GanttTaskRowProps {
  task: GanttTaskData;
  index: number;
  rowHeight: number;
  dateToX: (date: Date) => number;
  isCritical: boolean;
  onClick: () => void;
}

// Status colors
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  draft: { bg: "bg-gray-200", border: "border-gray-400", text: "text-gray-700" },
  new: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
  assigned: { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-700" },
  in_progress: { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-700" },
  on_hold: { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-700" },
  in_review: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
  rework: { bg: "bg-red-100", border: "border-red-400", text: "text-red-700" },
  done: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
  cancelled: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-500" },
};

// Priority indicators
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-400",
  medium: "bg-blue-400",
  high: "bg-orange-400",
  critical: "bg-red-500",
};

const BAR_HEIGHT = 24;
const MILESTONE_SIZE = 16;

export function GanttTaskRow({
  task,
  index,
  rowHeight,
  dateToX,
  isCritical,
  onClick,
}: GanttTaskRowProps) {
  // Calculate position and width
  const { left, width } = useMemo(() => {
    if (!task.start_date) {
      return { left: 0, width: 0 };
    }

    const startX = dateToX(new Date(task.start_date));

    if (task.is_milestone) {
      return { left: startX - MILESTONE_SIZE / 2, width: MILESTONE_SIZE };
    }

    if (!task.end_date) {
      // Single day task
      return { left: startX, width: 40 };
    }

    const endX = dateToX(new Date(task.end_date));
    const barWidth = Math.max(endX - startX, 20);

    return { left: startX, width: barWidth };
  }, [task, dateToX]);

  // Get status color
  const colors = STATUS_COLORS[task.status] || STATUS_COLORS.new;

  // Top position
  const top = index * rowHeight + (rowHeight - BAR_HEIGHT) / 2;

  // If no dates, don't render
  if (!task.start_date) {
    return null;
  }

  // Milestone rendering
  if (task.is_milestone) {
    return (
      <div
        className="absolute cursor-pointer"
        style={{
          left,
          top: index * rowHeight + (rowHeight - MILESTONE_SIZE) / 2,
          width: MILESTONE_SIZE,
          height: MILESTONE_SIZE,
        }}
        onClick={onClick}
        title={task.title}
      >
        <div
          className={`h-full w-full rotate-45 transform ${
            isCritical ? "bg-red-500" : "bg-amber-500"
          } border-2 border-white shadow`}
        />
      </div>
    );
  }

  // Regular task bar
  return (
    <div
      className={`absolute cursor-pointer rounded border ${colors.bg} ${colors.border} ${
        isCritical ? "ring-2 ring-red-400" : ""
      } transition-shadow hover:shadow-md`}
      style={{
        left,
        top,
        width,
        height: BAR_HEIGHT,
      }}
      onClick={onClick}
      title={`${task.title}\n${task.status} - ${task.progress}%`}
    >
      {/* Progress bar */}
      {task.progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-l bg-current opacity-20"
          style={{ width: `${task.progress}%` }}
        />
      )}

      {/* Priority indicator */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l ${PRIORITY_COLORS[task.priority]}`}
      />

      {/* Task title (only show if bar is wide enough) */}
      {width > 100 && (
        <div
          className={`flex h-full items-center px-2 text-xs font-medium ${colors.text} truncate`}
        >
          {task.title}
        </div>
      )}

      {/* Progress percentage (only show if bar is wide enough) */}
      {width > 60 && task.progress > 0 && task.progress < 100 && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
          {task.progress}%
        </div>
      )}

      {/* Critical path indicator */}
      {isCritical && (
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500 border border-white" />
      )}

      {/* Assignee avatar placeholder */}
      {task.assignee_name && width > 150 && (
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-[10px] font-medium text-white border border-white"
          title={task.assignee_name}
        >
          {task.assignee_name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
