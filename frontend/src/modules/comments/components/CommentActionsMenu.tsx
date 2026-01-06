/**
 * SmartTask360 — Comment Actions Dropdown Menu
 */

import { useState, useRef, useEffect } from "react";
import { TaskFormModal } from "../../tasks/components/TaskFormModal";

interface CommentActionsMenuProps {
  commentId: string;
  taskId: string;
  /** Comment text content for creating task from comment */
  commentContent: string;
  /** Project ID for pre-filling new task project */
  projectId?: string | null;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function CommentActionsMenu({
  commentId,
  taskId,
  commentContent,
  projectId,
  canEdit,
  onEdit,
  onDelete,
}: CommentActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreateSubtaskModalOpen, setIsCreateSubtaskModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks/${taskId}#comment-${commentId}`;
    navigator.clipboard.writeText(url);
    setIsOpen(false);
    // TODO: Show toast notification
  };

  // Build comment link URL
  const commentUrl = `${window.location.origin}/tasks/${taskId}#comment-${commentId}`;

  // Truncate title if too long (max 100 chars)
  const truncatedTitle = commentContent.length > 100
    ? commentContent.substring(0, 100) + "..."
    : commentContent;

  // Build description with source comment reference (using markdown link)
  const taskDescription = `${commentContent}\n\n---\nЗадача создана на основе [комментария](${commentUrl})`;

  const handleCreateTask = () => {
    setIsOpen(false);
    setIsCreateTaskModalOpen(true);
  };

  const handleCreateSubtask = () => {
    setIsOpen(false);
    setIsCreateSubtaskModalOpen(true);
  };

  const handleEditClick = () => {
    onEdit();
    setIsOpen(false);
  };

  const handleDeleteClick = () => {
    onDelete();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        type="button"
      >
        Ещё
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[200px]">
          <button
            onClick={handleCopyLink}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Скопировать ссылку
          </button>

          <button
            onClick={handleCreateTask}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Создать задачу
          </button>

          <button
            onClick={handleCreateSubtask}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Создать подзадачу
          </button>

          {canEdit && (
            <>
              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={handleEditClick}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </button>

              <button
                onClick={handleDeleteClick}
                className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить
              </button>
            </>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        defaultTitle={truncatedTitle}
        defaultDescription={taskDescription}
        defaultProjectId={projectId}
        defaultAssigneeId=""
      />

      {/* Create Subtask Modal */}
      <TaskFormModal
        isOpen={isCreateSubtaskModalOpen}
        onClose={() => setIsCreateSubtaskModalOpen(false)}
        parentId={taskId}
        defaultTitle={truncatedTitle}
        defaultDescription={taskDescription}
        defaultProjectId={projectId}
        defaultAssigneeId=""
      />
    </div>
  );
}
