import { useMutation, useQueryClient } from "@tanstack/react-query";
import { exportTasksExcel, getImportTemplate, importTasksExcel } from "../api";
import { taskKeys } from "./useTasks";
import type { TaskFilters, ImportResult } from "../types";

// Helper function to download blob as file
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Hook for exporting tasks to Excel
export function useExportTasks() {
  return useMutation<Blob, Error, TaskFilters | undefined>({
    mutationFn: exportTasksExcel,
    onSuccess: (blob) => {
      const date = new Date().toISOString().split("T")[0];
      downloadBlob(blob, `tasks_export_${date}.xlsx`);
    },
  });
}

// Hook for downloading import template
export function useDownloadTemplate() {
  return useMutation<Blob, Error, void>({
    mutationFn: getImportTemplate,
    onSuccess: (blob) => {
      downloadBlob(blob, "tasks_import_template.xlsx");
    },
  });
}

// Hook for importing tasks from Excel
export function useImportTasks() {
  const queryClient = useQueryClient();

  return useMutation<ImportResult, Error, File>({
    mutationFn: importTasksExcel,
    onSuccess: () => {
      // Invalidate task lists to refresh data
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
