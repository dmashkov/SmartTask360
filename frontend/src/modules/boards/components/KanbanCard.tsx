import { Link } from "react-router-dom";
import { Badge, Avatar, Tooltip } from "../../../shared/ui";
import { formatDate } from "../../../shared/lib/utils";
import type { BoardTaskWithDetails } from "../types";

interface KanbanCardProps {
  boardTask: BoardTaskWithDetails;
  isDragging?: boolean;
}

// Comment icon component
function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

// At mention icon component
function AtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );
}

export function KanbanCard({ boardTask, isDragging }: KanbanCardProps) {
  const isOverdue =
    boardTask.task_due_date &&
    new Date(boardTask.task_due_date) < new Date() &&
    boardTask.task_status !== "done";

  const hasComments = boardTask.total_comments_count > 0;
  const hasUnreadComments = boardTask.unread_comments_count > 0;
  const hasUnreadMentions = boardTask.unread_mentions_count > 0;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <Link to={`/tasks/${boardTask.task_id}`} className="block">
        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-blue-600">
          {boardTask.task_title}
        </h4>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <Badge type="priority" value={boardTask.task_priority} />

            {/* Comment indicators */}
            {hasComments && (
              <Tooltip content={`${boardTask.total_comments_count} комментариев${hasUnreadComments ? `, ${boardTask.unread_comments_count} непрочитанных` : ""}`}>
                <div className="flex items-center gap-0.5 text-xs text-gray-500 ml-1">
                  <CommentIcon className="w-3.5 h-3.5" />
                  <span>{boardTask.total_comments_count}</span>
                  {hasUnreadComments && (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </div>
              </Tooltip>
            )}

            {/* Unread mentions indicator */}
            {hasUnreadMentions && (
              <Tooltip content={`${boardTask.unread_mentions_count} упоминаний вас`}>
                <div className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                  <AtIcon className="w-3.5 h-3.5" />
                  <span>{boardTask.unread_mentions_count}</span>
                </div>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            {boardTask.task_due_date && (
              <span className={`text-xs ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                {formatDate(boardTask.task_due_date)}
              </span>
            )}
            {boardTask.task_assignee_id && <Avatar name="A" size="xs" />}
          </div>
        </div>
      </Link>
    </div>
  );
}
