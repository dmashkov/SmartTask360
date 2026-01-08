/**
 * Gantt Chart Component
 *
 * Custom Gantt chart implementation with:
 * - Day/Week/Month zoom levels
 * - Task bars with drag support
 * - Dependency lines
 * - Critical path highlighting
 * - Milestone markers
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GanttTaskData, GanttZoomLevel } from "../types";
import { GanttHeader } from "./GanttHeader";
import { GanttTaskRow } from "./GanttTaskRow";
import { GanttToolbar } from "./GanttToolbar";

interface GanttChartProps {
  tasks: GanttTaskData[];
  minDate: Date | null;
  maxDate: Date | null;
  criticalPath: string[];
  projectId: string;
  onTaskUpdate?: (taskId: string, start: Date, end: Date) => void;
  onTaskClick?: (taskId: string) => void;
}

// Zoom configurations
const ZOOM_CONFIG: Record<GanttZoomLevel, { columnWidth: number; unit: string }> = {
  day: { columnWidth: 40, unit: "day" },
  week: { columnWidth: 100, unit: "week" },
  month: { columnWidth: 150, unit: "month" },
};

// Row height in pixels
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 60;
const TASK_LABEL_WIDTH = 300;

export function GanttChart({
  tasks,
  minDate,
  maxDate,
  criticalPath,
  projectId,
  onTaskUpdate: _onTaskUpdate, // Reserved for future drag-resize support
  onTaskClick,
}: GanttChartProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<GanttZoomLevel>("week");
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Calculate date range with padding
  const { startDate, endDate, totalDays } = useMemo(() => {
    const now = new Date();
    let start = minDate ? new Date(minDate) : now;
    let end = maxDate ? new Date(maxDate) : now;

    // Add padding (2 weeks before and after)
    start = new Date(start.getTime() - 14 * 24 * 60 * 60 * 1000);
    end = new Date(end.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Ensure minimum range of 1 month
    const minRange = 30 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() < minRange) {
      end = new Date(start.getTime() + minRange);
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));

    return { startDate: start, endDate: end, totalDays: days };
  }, [minDate, maxDate]);

  // Calculate total width based on zoom
  const totalWidth = useMemo(() => {
    const config = ZOOM_CONFIG[zoom];
    if (zoom === "day") {
      return totalDays * config.columnWidth;
    } else if (zoom === "week") {
      return Math.ceil(totalDays / 7) * config.columnWidth;
    } else {
      return Math.ceil(totalDays / 30) * config.columnWidth;
    }
  }, [totalDays, zoom]);

  // Critical path set for quick lookup
  const criticalSet = useMemo(() => new Set(criticalPath), [criticalPath]);

  // Filter visible tasks (respect hierarchy expansion)
  const visibleTasks = useMemo(() => {
    const result: GanttTaskData[] = [];
    const hiddenParents = new Set<string>();

    for (const task of tasks) {
      // Check if any parent is collapsed
      if (task.parent_id && hiddenParents.has(task.parent_id)) {
        hiddenParents.add(task.id);
        continue;
      }

      // Check if parent is expanded
      if (task.parent_id) {
        const parentExpanded = expandedTasks.has(task.parent_id);
        if (!parentExpanded) {
          hiddenParents.add(task.id);
          continue;
        }
      }

      result.push(task);

      // If this task has children and is collapsed, mark it
      const hasChildren = tasks.some((t) => t.parent_id === task.id);
      if (hasChildren && !expandedTasks.has(task.id)) {
        hiddenParents.add(task.id);
      }
    }

    return result;
  }, [tasks, expandedTasks]);

  // Toggle task expansion
  const toggleExpand = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Expand all by default
  useEffect(() => {
    const parentsWithChildren = tasks
      .filter((t) => tasks.some((child) => child.parent_id === t.id))
      .map((t) => t.id);
    setExpandedTasks(new Set(parentsWithChildren));
  }, [tasks]);

  // Handle task click
  const handleTaskClick = useCallback(
    (taskId: string) => {
      if (onTaskClick) {
        onTaskClick(taskId);
      } else {
        navigate(`/tasks/${taskId}`);
      }
    },
    [navigate, onTaskClick]
  );

  // Convert date to X position
  const dateToX = useCallback(
    (date: Date): number => {
      const config = ZOOM_CONFIG[zoom];
      const daysDiff =
        (date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);

      if (zoom === "day") {
        return daysDiff * config.columnWidth;
      } else if (zoom === "week") {
        return (daysDiff / 7) * config.columnWidth;
      } else {
        return (daysDiff / 30) * config.columnWidth;
      }
    },
    [startDate, zoom]
  );

  // Check if task has children
  const hasChildren = useCallback(
    (taskId: string) => tasks.some((t) => t.parent_id === taskId),
    [tasks]
  );

  if (tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">Нет задач для отображения</p>
          <p className="text-sm">
            Добавьте задачи с датами для отображения на диаграмме Ганта
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <GanttToolbar
        zoom={zoom}
        onZoomChange={setZoom}
        showCriticalPath={showCriticalPath}
        onShowCriticalPathChange={setShowCriticalPath}
        showDependencies={showDependencies}
        onShowDependenciesChange={setShowDependencies}
        projectId={projectId}
      />

      {/* Main Gantt area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto border border-gray-200 bg-white"
      >
        <div className="flex" style={{ minWidth: TASK_LABEL_WIDTH + totalWidth }}>
          {/* Task labels column (fixed) */}
          <div
            className="sticky left-0 z-20 border-r border-gray-200 bg-gray-50"
            style={{ width: TASK_LABEL_WIDTH }}
          >
            {/* Header for labels */}
            <div
              className="flex items-center border-b border-gray-200 bg-gray-100 px-3 font-medium text-gray-700"
              style={{ height: HEADER_HEIGHT }}
            >
              Задача
            </div>

            {/* Task labels */}
            {visibleTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center border-b border-gray-100 px-2"
                style={{
                  height: ROW_HEIGHT,
                  paddingLeft: 8 + task.depth * 20,
                }}
              >
                {/* Expand/collapse button */}
                {hasChildren(task.id) && (
                  <button
                    onClick={() => toggleExpand(task.id)}
                    className="mr-1 flex h-5 w-5 items-center justify-center rounded text-gray-500 hover:bg-gray-200"
                  >
                    {expandedTasks.has(task.id) ? (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )}
                {!hasChildren(task.id) && <span className="mr-1 w-5" />}

                {/* Milestone icon */}
                {task.is_milestone && (
                  <span className="mr-1 text-amber-500" title="Веха">
                    ◆
                  </span>
                )}

                {/* Task title */}
                <button
                  onClick={() => handleTaskClick(task.id)}
                  className="flex-1 truncate text-left text-sm hover:text-blue-600"
                  title={task.title}
                >
                  {task.title}
                </button>
              </div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="flex-1">
            {/* Timeline header */}
            <GanttHeader
              startDate={startDate}
              endDate={endDate}
              zoom={zoom}
              height={HEADER_HEIGHT}
              columnWidth={ZOOM_CONFIG[zoom].columnWidth}
            />

            {/* Task rows */}
            <div className="relative">
              {/* Grid lines */}
              <GanttGrid
                startDate={startDate}
                endDate={endDate}
                zoom={zoom}
                rowCount={visibleTasks.length}
                rowHeight={ROW_HEIGHT}
                columnWidth={ZOOM_CONFIG[zoom].columnWidth}
              />

              {/* Today line */}
              <TodayLine
                dateToX={dateToX}
                height={visibleTasks.length * ROW_HEIGHT}
              />

              {/* Task bars */}
              {visibleTasks.map((task, index) => (
                <GanttTaskRow
                  key={task.id}
                  task={task}
                  index={index}
                  rowHeight={ROW_HEIGHT}
                  dateToX={dateToX}
                  isCritical={showCriticalPath && criticalSet.has(task.id)}
                  onClick={() => handleTaskClick(task.id)}
                />
              ))}

              {/* Dependency lines */}
              {showDependencies && (
                <DependencyLines
                  tasks={visibleTasks}
                  rowHeight={ROW_HEIGHT}
                  dateToX={dateToX}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Grid component
interface GanttGridProps {
  startDate: Date;
  endDate: Date;
  zoom: GanttZoomLevel;
  rowCount: number;
  rowHeight: number;
  columnWidth: number;
}

function GanttGrid({
  startDate,
  endDate,
  zoom,
  rowCount,
  rowHeight,
  columnWidth,
}: GanttGridProps) {
  const lines = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      result.push(new Date(current));

      if (zoom === "day") {
        current.setDate(current.getDate() + 1);
      } else if (zoom === "week") {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return result;
  }, [startDate, endDate, zoom]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Vertical lines */}
      {lines.map((_, i) => (
        <div
          key={i}
          className="absolute top-0 border-l border-gray-100"
          style={{
            left: i * columnWidth,
            height: rowCount * rowHeight,
          }}
        />
      ))}

      {/* Horizontal lines */}
      {Array.from({ length: rowCount }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-b border-gray-100"
          style={{ top: (i + 1) * rowHeight }}
        />
      ))}
    </div>
  );
}

// Today line component
interface TodayLineProps {
  dateToX: (date: Date) => number;
  height: number;
}

function TodayLine({ dateToX, height }: TodayLineProps) {
  const today = new Date();
  const x = dateToX(today);

  if (x < 0) return null;

  return (
    <div
      className="pointer-events-none absolute top-0 z-10 w-0.5 bg-red-500"
      style={{ left: x, height }}
    >
      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
    </div>
  );
}

// Dependency lines component
interface DependencyLinesProps {
  tasks: GanttTaskData[];
  rowHeight: number;
  dateToX: (date: Date) => number;
}

function DependencyLines({ tasks, rowHeight, dateToX }: DependencyLinesProps) {
  const taskIndexMap = useMemo(
    () => new Map(tasks.map((t, i) => [t.id, i])),
    [tasks]
  );

  const lines = useMemo(() => {
    const result: {
      from: { x: number; y: number };
      to: { x: number; y: number };
    }[] = [];

    for (const task of tasks) {
      const taskIndex = taskIndexMap.get(task.id);
      if (taskIndex === undefined) continue;

      for (const dep of task.dependencies) {
        const predIndex = taskIndexMap.get(dep.predecessor_id);
        if (predIndex === undefined) continue;

        const predTask = tasks[predIndex];
        if (!predTask.end_date || !task.start_date) continue;

        const fromX = dateToX(new Date(predTask.end_date));
        const fromY = predIndex * rowHeight + rowHeight / 2;

        const toX = dateToX(new Date(task.start_date));
        const toY = taskIndex * rowHeight + rowHeight / 2;

        result.push({ from: { x: fromX, y: fromY }, to: { x: toX, y: toY } });
      }
    }

    return result;
  }, [tasks, taskIndexMap, rowHeight, dateToX]);

  return (
    <svg className="pointer-events-none absolute inset-0 overflow-visible">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      {lines.map((line, i) => {
        // Create path with corner
        const midX = line.from.x + 10;
        const path = `M ${line.from.x} ${line.from.y}
                      L ${midX} ${line.from.y}
                      L ${midX} ${line.to.y}
                      L ${line.to.x - 5} ${line.to.y}`;

        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}
