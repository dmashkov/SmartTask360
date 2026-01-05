/**
 * SmartTask360 — Single comment item
 */

import { useState } from "react";
import { Avatar, Button, Textarea } from "../../../shared/ui";
import { formatDateTime } from "../../../shared/lib/utils";
import { getUserById, useUsersMap } from "../../users";
import { useUpdateComment, useDeleteComment } from "../hooks/useComments";
import type { Comment } from "../types";
import { useAuth } from "../../auth";

interface CommentItemProps {
  comment: Comment;
  taskId: string;
}

export function CommentItem({ comment, taskId }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const { usersMap } = useUsersMap();
  const { user: currentUser } = useAuth();

  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const author = comment.author_id ? getUserById(usersMap, comment.author_id) : null;
  const isAI = comment.author_type === "ai";
  const canEdit = !isAI && comment.author_id === currentUser?.id;

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
    <div id={`comment-${comment.id}`} className="flex gap-3 py-3 transition-colors">
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
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            {canEdit && (
              <div className="flex gap-2 mt-1">
                <button
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать
                </button>
                <button
                  className="text-xs text-gray-400 hover:text-red-600"
                  onClick={handleDelete}
                >
                  Удалить
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
