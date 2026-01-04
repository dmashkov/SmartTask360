import { useState, useRef, useCallback } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "../../../shared/ui";
import { useImportTasks, useDownloadTemplate } from "../hooks";
import type { ImportResult, ImportErrorDetail } from "../types";

interface ImportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportTasksModal({ isOpen, onClose }: ImportTasksModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importTasks = useImportTasks();
  const downloadTemplate = useDownloadTemplate();

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setIsDragging(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      // Validate file type
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        alert("Пожалуйста, выберите файл Excel (.xlsx или .xls)");
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const importResult = await importTasks.mutateAsync(selectedFile);
      setResult(importResult);
      if (importResult.success && importResult.errors.length === 0) {
        // Auto-close after successful import with no errors
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Import error:", error);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate.mutate();
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader onClose={handleClose}>Импорт задач из Excel</ModalHeader>

      <ModalBody className="space-y-4">
        {/* Template download section */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <span className="text-sm text-blue-700">
              Скачайте шаблон для заполнения
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            isLoading={downloadTemplate.isPending}
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Шаблон
          </Button>
        </div>

        {/* Drag and drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : selectedFile
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />

          {selectedFile ? (
            <div className="space-y-2">
              <svg
                className="h-12 w-12 mx-auto text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Выбрать другой файл
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="h-12 w-12 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm text-gray-600">
                Перетащите файл сюда или{" "}
                <button
                  type="button"
                  onClick={handleSelectFile}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  выберите
                </button>
              </p>
              <p className="text-xs text-gray-400">Поддерживаются .xlsx, .xls</p>
            </div>
          )}
        </div>

        {/* Import result */}
        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success && result.errors.length === 0
                ? "bg-green-50"
                : result.errors.length > 0
                ? "bg-yellow-50"
                : "bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success && result.errors.length === 0 ? (
                <svg
                  className="h-5 w-5 text-green-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-yellow-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Результат импорта
                </p>
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-gray-600">
                    Всего строк: {result.total_rows}
                  </p>
                  <p className="text-green-600">
                    Импортировано: {result.imported}
                  </p>
                  {result.skipped > 0 && (
                    <p className="text-yellow-600">
                      Пропущено: {result.skipped}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Errors table */}
            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Ошибки ({result.errors.length}):
                </p>
                <div className="max-h-48 overflow-auto border border-gray-200 rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Строка
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Поле
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600">
                          Ошибка
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {result.errors.map((error: ImportErrorDetail, index: number) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-gray-900">
                            {error.row}
                          </td>
                          <td className="px-3 py-2 text-gray-900">
                            {error.field}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {error.message}
                            {error.value && (
                              <span className="text-gray-400">
                                {" "}
                                (значение: "{error.value}")
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={handleClose}>
          {result ? "Закрыть" : "Отмена"}
        </Button>
        {!result && (
          <Button
            onClick={handleImport}
            disabled={!selectedFile}
            isLoading={importTasks.isPending}
          >
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Импортировать
          </Button>
        )}
        {result && result.errors.length > 0 && (
          <Button onClick={() => setResult(null)}>
            Загрузить другой файл
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
