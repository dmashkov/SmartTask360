/**
 * SmartTask360 — Documents API
 */

import { api } from "../../shared/api";
import type { Document, DocumentStats } from "./types";

export async function getTaskDocuments(taskId: string): Promise<Document[]> {
  const { data } = await api.get<Document[]>(`/documents/tasks/${taskId}/documents`);
  return data;
}

export async function getTaskDocumentStats(taskId: string): Promise<DocumentStats> {
  const { data } = await api.get<DocumentStats>(`/documents/tasks/${taskId}/stats`);
  return data;
}

export async function uploadDocument(
  taskId: string,
  file: File,
  description?: string
): Promise<Document> {
  const formData = new FormData();
  formData.append("task_id", taskId);
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  const { data } = await api.post<Document>("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await api.delete(`/documents/${documentId}`);
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string> {
  const { data } = await api.get<{ download_url: string }>(`/documents/${documentId}/download-url`);
  return data.download_url;
}
