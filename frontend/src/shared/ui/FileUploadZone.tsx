/**
 * SmartTask360 — File Upload Zone with Drag & Drop
 */

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

export type DocumentType = "requirement" | "attachment" | "result";

interface UploadedFile {
  id: string;
  filename: string;
  file_size: number;
}

interface FileUploadZoneProps {
  taskId: string;
  documentType: DocumentType;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadProgress?: (progress: number) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  accept?: string; // file types to accept
  compact?: boolean; // compact mode for inline display
}

export function FileUploadZone({
  taskId,
  documentType,
  onUploadComplete,
  onUploadProgress,
  maxFiles = 10,
  maxFileSize = 100, // 100 MB
  accept,
  compact = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `Файл "${file.name}" слишком большой. Максимальный размер: ${maxFileSize} МБ`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("task_id", taskId);
    formData.append("document_type", documentType);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        filename: data.original_filename,
        file_size: data.file_size,
      };
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const filesArray = Array.from(files);

    // Check max files limit
    if (uploadedFiles.length + filesArray.length > maxFiles) {
      setError(`Можно загрузить максимум ${maxFiles} файлов`);
      return;
    }

    // Validate all files first
    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsUploading(true);

    const uploaded: UploadedFile[] = [];
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      if (onUploadProgress) {
        onUploadProgress(((i + 1) / filesArray.length) * 100);
      }

      const result = await uploadFile(file);
      if (result) {
        uploaded.push(result);
      }
    }

    setIsUploading(false);
    setUploadedFiles((prev) => [...prev, ...uploaded]);

    if (onUploadComplete) {
      onUploadComplete(uploaded);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  if (compact) {
    // Compact mode: just a button
    return (
      <div className="inline-block">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Spinner size="sm" />
          ) : (
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          )}
          Прикрепить файл
        </Button>
      </div>
    );
  }

  // Full mode: drag & drop zone
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={handleButtonClick}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Spinner size="md" />
            <p className="text-sm text-gray-600">Загрузка файлов...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">
              📎 Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-xs text-gray-400">
              Максимальный размер: {maxFileSize} МБ
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Загружено файлов: {uploadedFiles.length}
          </p>
          <div className="space-y-1">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
              >
                <span className="truncate">{file.filename}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatFileSize(file.file_size)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
