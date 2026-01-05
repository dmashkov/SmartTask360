/**
 * SmartTask360 — Status Change Modal
 * Modal for changing task status with required comment and optional file attachments
 */

import { useState, useRef } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  Badge,
} from "../../../shared/ui";
import { useUploadDocument } from "../../documents";
import type { TaskStatus } from "../types";

// Statuses that require completion comment
const COMPLETION_STATUSES: TaskStatus[] = ["done", "in_review"];

// Statuses that require rework comment (explanation why returned)
const REWORK_STATUSES: TaskStatus[] = ["rework"];

// Placeholder text based on status
const PLACEHOLDER_TEXT: Partial<Record<TaskStatus, string>> = {
  done: "Опишите результат выполнения задачи...",
  in_review: "Опишите выполненную работу для проверки...",
  rework: "Укажите причину возврата на доработку и требуемые исправления...",
};

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentStatus: TaskStatus;
  newStatus: TaskStatus;
  onConfirm: (comment: string) => Promise<void>;
}

interface SelectedFile {
  file: File;
  id: string;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  taskId,
  currentStatus,
  newStatus,
  onConfirm,
}: StatusChangeModalProps) {
  const [comment, setComment] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDocument = useUploadDocument(taskId);

  // Determine if comment is required
  const isCommentRequired =
    COMPLETION_STATUSES.includes(newStatus) ||
    REWORK_STATUSES.includes(newStatus);

  // Determine modal title and description
  const getModalConfig = () => {
    if (COMPLETION_STATUSES.includes(newStatus)) {
      return {
        title: newStatus === "done" ? "Завершение задачи" : "Отправка на проверку",
        description: newStatus === "done"
          ? "Опишите результат выполнения задачи и приложите файлы при необходимости."
          : "Опишите выполненную работу и приложите результаты для проверки.",
        commentLabel: newStatus === "done" ? "Результат выполнения *" : "Описание работы *",
      };
    }
    if (REWORK_STATUSES.includes(newStatus)) {
      return {
        title: "Возврат на доработку",
        description: "Укажите причину возврата и требуемые исправления.",
        commentLabel: "Причина возврата *",
      };
    }
    return {
      title: "Изменение статуса",
      description: "Вы можете добавить комментарий к изменению статуса.",
      commentLabel: "Комментарий",
    };
  };

  const config = getModalConfig();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = Array.from(files).map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async () => {
    // Validate
    if (isCommentRequired && !comment.trim()) {
      setError("Комментарий обязателен для данного перехода статуса");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First, upload all files
      for (const { file } of selectedFiles) {
        await uploadDocument.mutateAsync({ file });
      }

      // Then change status with comment
      await onConfirm(comment.trim());

      // Reset and close
      setComment("");
      setSelectedFiles([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setComment("");
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Б";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader onClose={handleClose}>{config.title}</ModalHeader>
      <ModalBody>
        {/* Status change indicator */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <Badge type="status" value={currentStatus} />
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <Badge type="status" value={newStatus} />
        </div>

        <p className="text-sm text-gray-600 mb-4">{config.description}</p>

        {/* Comment field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {config.commentLabel}
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={PLACEHOLDER_TEXT[newStatus] || "Добавьте комментарий..."}
            rows={4}
            className="w-full"
          />
        </div>

        {/* File upload section - only for completion statuses */}
        {COMPLETION_STATUSES.includes(newStatus) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Файлы (опционально)
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors w-full justify-center"
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-gray-600">Выбрать файлы</span>
            </button>

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map(({ file, id }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          Подтвердить
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * Helper function to check if status change requires modal
 */
export function requiresStatusChangeModal(newStatus: TaskStatus): boolean {
  return (
    COMPLETION_STATUSES.includes(newStatus) ||
    REWORK_STATUSES.includes(newStatus)
  );
}
