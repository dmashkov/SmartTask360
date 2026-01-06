/**
 * SmartTask360 — Documents types
 */

export type DocumentType = "requirement" | "attachment" | "result";

export interface Document {
  id: string;
  task_id: string;
  comment_id: string | null;
  uploader_id: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  description: string | null;
  document_type: DocumentType;
  created_at: string;
}

export interface DocumentUpload {
  task_id: string;
  comment_id?: string | null;
  file: File;
  description?: string;
  document_type?: DocumentType;
}

export interface DocumentUpdate {
  description: string | null;
}

export interface DocumentStats {
  total_count: number;
  total_size: number;
  total_size_mb: number;
}
