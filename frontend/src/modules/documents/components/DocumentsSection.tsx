/**
 * SmartTask360 — Documents section for task detail page
 */

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "../../../shared/ui";
import { useTaskDocuments, useUploadDocument } from "../hooks/useDocuments";
import { DocumentItem } from "./DocumentItem";

interface DocumentsSectionProps {
  taskId: string;
}

export function DocumentsSection({ taskId }: DocumentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents = [], isLoading } = useTaskDocuments(taskId);
  const uploadDocument = useUploadDocument(taskId);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload each file
    for (const file of Array.from(files)) {
      await uploadDocument.mutateAsync({ file });
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : documents.length > 0 ? (
            <div className="-mx-3">
              {documents.map((doc) => (
                <DocumentItem key={doc.id} document={doc} taskId={taskId} />
              ))}
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
          )}
        </CardContent>
      )}
    </Card>
  );
}
