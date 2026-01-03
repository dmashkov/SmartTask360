import { Link } from "react-router-dom";
import { Badge, Avatar } from "../../../shared/ui";
import { formatDate } from "../../../shared/lib/utils";
import type { BoardTaskWithDetails } from "../types";

interface KanbanCardProps {
  boardTask: BoardTaskWithDetails;
  isDragging?: boolean;
}

export function KanbanCard({ boardTask, isDragging }: KanbanCardProps) {
  const isOverdue =
    boardTask.task_due_date &&
    new Date(boardTask.task_due_date) < new Date() &&
    boardTask.task_status !== "done";

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
