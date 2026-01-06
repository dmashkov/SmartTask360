/**
 * SmartTask360 — Comments section for task detail page
 */

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner, MentionInput } from "../../../shared/ui";
import { useTaskComments, useCreateComment, useMarkCommentsAsRead } from "../hooks/useComments";
import { CommentItem } from "./CommentItem";
import { uploadDocument } from "../../documents/api";
import { useQueryClient } from "@tanstack/react-query";

interface CommentsSectionProps {
  taskId: string;
  /** Project ID for creating tasks from comments */
  projectId?: string | null;
  /** When embedded in tabs, hide header and always show content */
  embedded?: boolean;
}

interface SelectedFile {
  file: File;
  id: string;
}

export function CommentsSection({ taskId, projectId, embedded = false }: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const createComment = useCreateComment();

  // Mark comments as read when section is viewed
  useMarkCommentsAsRead(taskId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Find parent comment for reply preview
  const replyToComment = replyToId ? comments.find((c) => c.id === replyToId) : null;

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Б";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && selectedFiles.length === 0) return;

    try {
      setIsUploading(true);

      // Create comment first
      const comment = await createComment.mutateAsync({
        task_id: taskId,
        content: newComment.trim() || "(Файлы)",
        reply_to_id: replyToId,
      });

      // Upload files with comment_id
      if (selectedFiles.length > 0 && comment?.id) {
        for (const { file } of selectedFiles) {
          await uploadDocument(taskId, file, undefined, "attachment", comment.id);
        }
        // Invalidate documents cache to show uploaded files
        queryClient.invalidateQueries({ queryKey: ["documents", taskId] });
      }

      // Clear form
      setNewComment("");
      setSelectedFiles([]);
      setReplyToId(null);
    } catch (error) {
      console.error("Ошибка при отправке комментария:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyToId(commentId);
    // Scroll to form
    setTimeout(() => {
      const form = document.querySelector('form textarea');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (form as HTMLTextAreaElement).focus();
      }
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyToId(null);
  };

  // Filter top-level comments (those without reply_to_id)
  const topLevelComments = comments.filter((c) => !c.reply_to_id);

  // Helper to get replies for a comment
  const getReplies = (commentId: string) => {
    return comments.filter((c) => c.reply_to_id === commentId);
  };

  // Content to render (shared between embedded and card modes)
  const content = isLoading ? (
    <div className="flex justify-center py-4">
      <Spinner size="sm" />
    </div>
  ) : (
    <>
      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {topLevelComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                taskId={taskId}
                projectId={projectId}
                onReply={handleReply}
              />
              {/* Nested replies */}
              {getReplies(comment.id).length > 0 && (
                <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                  {getReplies(comment.id).map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      taskId={taskId}
                      projectId={projectId}
                      onReply={handleReply}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic py-2">Нет комментариев</p>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-100">
        {/* Reply preview */}
        {replyToComment && (
          <div className="mb-2 p-2 bg-blue-50 border-l-2 border-blue-500 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-700 font-medium">
                Ответ на комментарий
              </span>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 line-clamp-2">{replyToComment.content}</p>
          </div>
        )}
        <MentionInput
          value={newComment}
          onChange={setNewComment}
          placeholder="Написать комментарий... (@ для упоминания)"
          rows={2}
        />

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedFiles.map(({ file, id }) => (
              <div
                key={id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="h-3 w-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700 truncate">{file.name}</span>
                  <span className="text-gray-500 shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Прикрепить файл
          </button>

          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim() && selectedFiles.length === 0}
            isLoading={createComment.isPending || isUploading}
          >
            Отправить
          </Button>
        </div>
      </form>
    </>
  );

  // Embedded mode: no card wrapper, always visible
  if (embedded) {
    return <div className="p-4">{content}</div>;
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
              Комментарии {comments.length > 0 && `(${comments.length})`}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {content}
        </CardContent>
      )}
    </Card>
  );
}
