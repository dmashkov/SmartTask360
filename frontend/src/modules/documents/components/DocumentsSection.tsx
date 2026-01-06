/**
 * SmartTask360 — Documents section for task detail page
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Spinner } from "../../../shared/ui";
import { useTaskDocuments, useDeleteDocument } from "../hooks/useDocuments";
import { api } from "../../../shared/api";

interface DocumentsSectionProps {
  taskId: string;
  embedded?: boolean;
}

export function DocumentsSection({ taskId, embedded = false }: DocumentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: documents = [], isLoading } = useTaskDocuments(taskId);
  const deleteDoc = useDeleteDocument(taskId);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Б";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      // Download file through backend API with authentication
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob', // Important for file download
      });

      // Create blob URL and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Failed to download document:", error);
      alert(`Ошибка при скачивании файла: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (window.confirm(`Удалить документ "${filename}"?`)) {
      await deleteDoc.mutateAsync(documentId);
    }
  };

  const requirementDocs = documents.filter((d) => d.document_type === "requirement");
  const attachmentDocs = documents.filter((d) => d.document_type === "attachment");
  const resultDocs = documents.filter((d) => d.document_type === "result");

  const renderDocumentList = (docs: typeof documents, title: string, icon: string) => {
    if (docs.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <span>{icon}</span>
          <span>{title}</span>
          <span className="text-gray-400">({docs.length})</span>
        </h4>
        <div className="space-y-1">
          {docs.map((doc) => (
            <div
              key={doc.id}
              id={`document-${doc.id}`}
              className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleDownload(doc.id, doc.original_filename)}
                    className="text-sm text-gray-700 hover:text-blue-600 truncate block text-left"
                  >
                    {doc.original_filename}
                  </button>
                  {doc.comment_id && (
                    <button
                      onClick={() => {
                        const event = new CustomEvent('show-comment', { detail: { commentId: doc.comment_id } });
                        window.dispatchEvent(event);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      → из комментария
                    </button>
                  )}
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {formatFileSize(doc.file_size)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(doc.id, doc.original_filename)}
                disabled={deleteDoc.isPending}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 ml-2"
                title="Удалить"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const content = isLoading ? (
    <div className="flex justify-center py-4">
      <Spinner size="sm" />
    </div>
  ) : documents.length === 0 ? (
    <p className="text-sm text-gray-400 italic py-2">Нет документов</p>
  ) : (
    <>
      {renderDocumentList(requirementDocs, "Исходные материалы", "📋")}
      {renderDocumentList(attachmentDocs, "Рабочие файлы", "📂")}
      {renderDocumentList(resultDocs, "Результаты", "✅")}
    </>
  );

  if (embedded) {
    return <div className="p-4">{content}</div>;
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <CardTitle>
              Документы {documents.length > 0 && `(${documents.length})`}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      {isExpanded && <CardContent className="pt-0">{content}</CardContent>}
    </Card>
  );
}
