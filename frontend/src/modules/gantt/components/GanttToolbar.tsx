/**
 * Gantt Chart Toolbar Component
 *
 * Provides controls for:
 * - Zoom level (day/week/month)
 * - Toggle critical path
 * - Toggle dependencies
 * - Create baseline
 */

import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { useCreateBulkBaselines, useGanttData } from "../hooks/useGantt";
import type { GanttZoomLevel } from "../types";

interface GanttToolbarProps {
  zoom: GanttZoomLevel;
  onZoomChange: (zoom: GanttZoomLevel) => void;
  showCriticalPath: boolean;
  onShowCriticalPathChange: (show: boolean) => void;
  showDependencies: boolean;
  onShowDependenciesChange: (show: boolean) => void;
  projectId: string;
}

const ZOOM_OPTIONS: { value: GanttZoomLevel; label: string }[] = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
];

export function GanttToolbar({
  zoom,
  onZoomChange,
  showCriticalPath,
  onShowCriticalPathChange,
  showDependencies,
  onShowDependenciesChange,
  projectId,
}: GanttToolbarProps) {
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);
  const { data: ganttData } = useGanttData(projectId);
  const createBaselines = useCreateBulkBaselines();

  const handleCreateBaseline = async () => {
    if (!ganttData?.tasks.length) return;

    const name = prompt("Название базового плана:", `Базовый план ${new Date().toLocaleDateString("ru-RU")}`);
    if (name === null) return;

    setIsCreatingBaseline(true);
    try {
      await createBaselines.mutateAsync({
        task_ids: ganttData.tasks.map((t) => t.id),
        baseline_name: name || undefined,
      });
      alert("Базовый план создан");
    } catch (error) {
      console.error("Failed to create baseline:", error);
      alert("Ошибка при создании базового плана");
    } finally {
      setIsCreatingBaseline(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      {/* Left side - Zoom controls */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Масштаб:</span>
        <div className="flex rounded-lg border border-gray-300 bg-gray-50">
          {ZOOM_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onZoomChange(option.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                zoom === option.value
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center - View options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showCriticalPath}
            onChange={(e) => onShowCriticalPathChange(e.target.checked)}
            className="rounded border-gray-300 text-red-500 focus:ring-red-500"
          />
          Критический путь
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDependencies}
            onChange={(e) => onShowDependenciesChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          Зависимости
        </label>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateBaseline}
          disabled={isCreatingBaseline || !ganttData?.tasks.length}
        >
          {isCreatingBaseline ? "Создание..." : "Сохранить базовый план"}
        </Button>
      </div>
    </div>
  );
}
