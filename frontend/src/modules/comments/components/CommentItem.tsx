/**
 * SmartTask360 — Single comment item
 */

import { useState } from "react";
import { Avatar, Button, Textarea, Linkify } from "../../../shared/ui";
import { formatDateTime } from "../../../shared/lib/utils";
import { getUserById, useUsersMap } from "../../users";
import { useUpdateComment, useDeleteComment } from "../hooks/useComments";
import type { Comment } from "../types";
import { useAuth } from "../../auth";
import { useTaskDocuments } from "../../documents";
import { CommentReactions } from "./CommentReactions";
import { CommentActionsMenu } from "./CommentActionsMenu";

interface CommentItemProps {
  comment: Comment;
  taskId: string;
  /** Project ID for creating tasks from comment */
  projectId?: string | null;
  onReply?: (commentId: string) => void;
  isReply?: boolean;
}

export function CommentItem({ comment, taskId, projectId, onReply, isReply = false }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isHovered, setIsHovered] = useState(false);
  const { usersMap } = useUsersMap();
  const { user: currentUser } = useAuth();
  const { data: allDocuments = [] } = useTaskDocuments(taskId);

  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const author = comment.author_id ? getUserById(usersMap, comment.author_id) : null;
  const isAI = comment.author_type === "ai";
  const canEdit = !isAI && comment.author_id === currentUser?.id;

  // Filter documents attached to this comment
  const commentDocuments = allDocuments.filter((doc) => doc.comment_id === comment.id);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Б";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSave = async () => {
    if (!editContent.trim()) return;
    await updateComment.mutateAsync({
      commentId: comment.id,
      data: { content: editContent.trim() },
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Удалить комментарий?")) {
      await deleteComment.mutateAsync(comment.id);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className="flex gap-3 py-3 px-2 -mx-2 rounded-lg transition-colors duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isAI ? (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        ) : (
          <Avatar name={author?.name || "?"} size="sm" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {isAI ? "AI Ассистент" : (author?.name || "Неизвестный")}
          </span>
          <span className="text-xs text-gray-500">
            {formatDateTime(comment.created_at)}
          </span>
          {comment.created_at !== comment.updated_at && (
            <span className="text-xs text-gray-400">(изменён)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={updateComment.isPending}
              >
                Сохранить
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              <Linkify>{comment.content}</Linkify>
            </p>

            {/* Attached documents */}
            {commentDocuments.length > 0 && (
              <div className="mt-2 space-y-1">
                {commentDocuments.map((doc) => (
                  <a
                    key={doc.id}
                    href="#documents"
                    onClick={(e) => {
                      e.preventDefault();
                      // Switch to documents tab and scroll to this document
                      const event = new CustomEvent('show-document', { detail: { documentId: doc.id } });
                      window.dispatchEvent(event);
                    }}
                    className="flex items-center gap-2 p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-xs text-blue-700 transition-colors"
                  >
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate">{doc.original_filename}</span>
                    <span className="text-gray-500 shrink-0">
                      ({formatFileSize(doc.file_size)})
                    </span>
                  </a>
                ))}
              </div>
            )}

            {/* Actions row: Reactions + Reply + More menu - all in one line */}
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              {/* Reactions (renders as fragments) */}
              <CommentReactions commentId={comment.id} showAddButton={isHovered} />

              {/* Separator if there are actions */}
              {(!isReply && onReply) && <span className="text-gray-300">·</span>}

              {/* Reply button */}
              {!isReply && onReply && (
                <button
                  className="text-xs text-gray-400 hover:text-blue-600"
                  onClick={() => onReply(comment.id)}
                >
                  Ответить
                </button>
              )}

              <span className="text-gray-300">·</span>

              {/* More actions menu */}
              <CommentActionsMenu
                commentId={comment.id}
                taskId={taskId}
                commentContent={comment.content}
                projectId={projectId}
                canEdit={canEdit}
                onEdit={() => setIsEditing(true)}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
