/**
 * Gantt Module Public API
 */

// Types
export type {
  BulkBaselineCreate,
  DependencyType,
  GanttDateUpdate,
  GanttResponse,
  GanttTaskData,
  GanttViewState,
  GanttZoomLevel,
  TaskBaseline,
  TaskDependency,
  TaskDependencyBrief,
  TaskDependencyCreate,
} from "./types";

// API functions
export {
  createBaseline,
  createBulkBaselines,
  createDependency,
  deleteBaseline,
  deleteDependency,
  getGanttData,
  getTaskBaselines,
  getTaskDependencies,
  updateTaskDates,
} from "./api";

// Hooks
export {
  ganttKeys,
  useCreateBaseline,
  useCreateBulkBaselines,
  useCreateDependency,
  useDeleteBaseline,
  useDeleteDependency,
  useGanttData,
  useTaskBaselines,
  useTaskDependencies,
  useUpdateTaskDates,
} from "./hooks/useGantt";

// Components
export { GanttChart } from "./components/GanttChart";
export { GanttHeader } from "./components/GanttHeader";
export { GanttTaskRow } from "./components/GanttTaskRow";
export { GanttToolbar } from "./components/GanttToolbar";
