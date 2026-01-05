/**
 * SmartTask360 — Project Boards Tab
 * Displays list of boards belonging to a project
 */

import { Link } from "react-router-dom";
import { Spinner, EmptyState, Button } from "../../../shared/ui";
import { useProjectBoards } from "../hooks";
import type { ProjectBoard } from "../api";

interface ProjectBoardsTabProps {
  projectId: string;
}

function BoardCard({ board }: { board: ProjectBoard }) {
  return (
    <Link
      to={`/boards/${board.id}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900">{board.name}</h3>
        {board.is_default && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
            По умолчанию
          </span>
        )}
      </div>

      {board.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {board.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
          <span>{board.columns_count} колонок</span>
        </div>

        <div className="flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{board.tasks_count} задач</span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectBoardsTab({ projectId }: ProjectBoardsTabProps) {
  const { data: boards = [], isLoading, error } = useProjectBoards(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Ошибка загрузки досок
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <EmptyState
        title="Нет досок"
        description="В этом проекте пока нет досок"
        action={
          <Link to={`/boards?project_id=${projectId}`}>
            <Button variant="outline" size="sm">
              Создать доску
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.map((board) => (
          <BoardCard key={board.id} board={board} />
        ))}
      </div>

      {/* Link to boards section */}
      <div className="mt-4 text-center">
        <Link
          to={`/boards?project_id=${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Открыть в разделе Доски
        </Link>
      </div>
    </div>
  );
}
