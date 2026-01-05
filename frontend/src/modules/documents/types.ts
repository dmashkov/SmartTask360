/**
 * SmartTask360 — Documents types
 */

export interface Document {
  id: string;
  task_id: string;
  uploader_id: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  description: string | null;
  created_at: string;
}

export interface DocumentUpload {
  task_id: string;
  file: File;
  description?: string;
}

export interface DocumentUpdate {
  description: string | null;
}

export interface DocumentStats {
  total_count: number;
  total_size: number;
  total_size_mb: number;
}
