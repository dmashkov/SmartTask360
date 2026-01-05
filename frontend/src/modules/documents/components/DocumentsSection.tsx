/**
 * SmartTask360 — Documents section for task detail page
 * Now with grouping by document type (requirement, attachment, result)
 */

import { useState, useRef, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "../../../shared/ui";
import { useTaskDocuments, useUploadDocument } from "../hooks/useDocuments";
import { DocumentItem } from "./DocumentItem";
import type { Document, DocumentType } from "../types";

interface DocumentsSectionProps {
  taskId: string;
  /** When embedded in tabs, hide header and always show content */
  embedded?: boolean;
}

// Document type labels and icons
const DOCUMENT_TYPE_CONFIG: Record<DocumentType, { label: string; icon: string; description: string }> = {
  requirement: {
    label: "Исходные материалы",
    icon: "📋",
    description: "Документы, прикрепленные при создании задачи",
  },
  attachment: {
    label: "Рабочие файлы",
    icon: "📂",
    description: "Файлы, загруженные в процессе работы",
  },
  result: {
    label: "Результаты",
    icon: "✅",
    description: "Файлы-результаты выполнения задачи",
  },
};

interface DocumentGroupProps {
  type: DocumentType;
  documents: Document[];
  taskId: string;
}

function DocumentGroup({ type, documents, taskId }: DocumentGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = DOCUMENT_TYPE_CONFIG[type];

  if (documents.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left py-2 hover:bg-gray-50 rounded transition-colors"
      >
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-base">{config.icon}</span>
        <h4 className="text-sm font-medium text-gray-900">
          {config.label} ({documents.length})
        </h4>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 -mx-3">
          {documents.map((doc) => (
            <DocumentItem key={doc.id} document={doc} taskId={taskId} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocumentsSection({ taskId, embedded = false }: DocumentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents = [], isLoading } = useTaskDocuments(taskId);
  const uploadDocument = useUploadDocument(taskId);

  // Group documents by type
  const groupedDocuments = useMemo(() => {
    const groups: Record<DocumentType, Document[]> = {
      requirement: [],
      attachment: [],
      result: [],
    };

    documents.forEach((doc) => {
      groups[doc.document_type].push(doc);
    });

    return groups;
  }, [documents]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload each file as attachment (default for manual uploads)
    for (const file of Array.from(files)) {
      await uploadDocument.mutateAsync({
        file,
        document_type: "attachment",
      });
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Hidden file input (always needed)
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      className="hidden"
      onChange={handleFileSelect}
    />
  );

  // Content to render (shared between embedded and card modes)
  const content = isLoading ? (
    <div className="flex justify-center py-4">
      <Spinner size="sm" />
    </div>
  ) : documents.length > 0 ? (
    <div>
      <DocumentGroup type="requirement" documents={groupedDocuments.requirement} taskId={taskId} />
      <DocumentGroup type="attachment" documents={groupedDocuments.attachment} taskId={taskId} />
      <DocumentGroup type="result" documents={groupedDocuments.result} taskId={taskId} />
    </div>
  ) : (
    <div className="text-center py-4">
      <p className="text-sm text-gray-400 italic mb-2">Нет документов</p>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleUploadClick}
      >
        Загрузить первый файл
      </Button>
    </div>
  );

  // Embedded mode: no card wrapper, always visible, with upload button at top
  if (embedded) {
    return (
      <div className="p-4">
        {fileInput}
        <div className="flex justify-end mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleUploadClick}
            isLoading={uploadDocument.isPending}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Загрузить
          </Button>
        </div>
        {content}
      </div>
    );
  }

  // Card mode with collapsible header
  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
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
          {isExpanded && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
              isLoading={uploadDocument.isPending}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Загрузить
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {fileInput}
          {content}
        </CardContent>
      )}
    </Card>
  );
}
