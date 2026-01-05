/**
 * SmartTask360 — Comments section for task detail page
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Textarea, Spinner } from "../../../shared/ui";
import { useTaskComments, useCreateComment } from "../hooks/useComments";
import { CommentItem } from "./CommentItem";

interface CommentsSectionProps {
  taskId: string;
  /** When embedded in tabs, hide header and always show content */
  embedded?: boolean;
}

export function CommentsSection({ taskId, embedded = false }: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newComment, setNewComment] = useState("");
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const createComment = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await createComment.mutateAsync({
      task_id: taskId,
      content: newComment.trim(),
    });
    setNewComment("");
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
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} taskId={taskId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic py-2">Нет комментариев</p>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-100">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Написать комментарий..."
          rows={2}
        />
        <div className="flex justify-end mt-2">
          <Button
            type="submit"
            size="sm"
            disabled={!newComment.trim()}
            isLoading={createComment.isPending}
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
