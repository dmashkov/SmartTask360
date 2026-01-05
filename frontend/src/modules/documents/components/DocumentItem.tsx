/**
 * SmartTask360 — Single document item
 */

import { formatDateTime } from "../../../shared/lib/utils";
import { getUserById, useUsersMap } from "../../users";
import { useDeleteDocument, useDownloadDocument } from "../hooks/useDocuments";
import { useAuth } from "../../auth";
import type { Document } from "../types";

interface DocumentItemProps {
  document: Document;
  taskId: string;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Get file icon based on mime type
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📽️";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";
  return "📎";
}

export function DocumentItem({ document, taskId }: DocumentItemProps) {
  const { usersMap } = useUsersMap();
  const { user: currentUser } = useAuth();
  const deleteDoc = useDeleteDocument(taskId);
  const downloadDoc = useDownloadDocument();

  const uploader = document.uploader_id ? getUserById(usersMap, document.uploader_id) : null;
  const canDelete = document.uploader_id === currentUser?.id;

  const handleDownload = () => {
    downloadDoc.mutate(document.id);
  };

  const handleDelete = () => {
    if (window.confirm(`Удалить файл "${document.original_filename}"?`)) {
      deleteDoc.mutate(document.id);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-md group">
      {/* Icon */}
      <span className="text-xl">{getFileIcon(document.mime_type)}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={handleDownload}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline truncate block max-w-full text-left"
          title={document.original_filename}
        >
          {document.original_filename}
        </button>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>{formatFileSize(document.file_size)}</span>
          <span>•</span>
          <span>{uploader?.name || "Неизвестный"}</span>
          <span>•</span>
          <span>{formatDateTime(document.created_at)}</span>
        </div>
        {document.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{document.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
          title="Скачать"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        {canDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            title="Удалить"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
