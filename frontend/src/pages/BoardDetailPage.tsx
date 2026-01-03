import { useParams, Link } from "react-router-dom";
import { Button, Loading } from "../shared/ui";
import { useBoard, KanbanBoard } from "../modules/boards";

export function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { data: board, isLoading, error } = useBoard(boardId || "");

  if (isLoading) {
    return <Loading message="Загрузка доски..." />;
  }

  if (error || !board) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Доска не найдена</h1>
        <p className="text-gray-600 mt-2">Запрашиваемая доска не существует.</p>
        <Link to="/boards">
          <Button className="mt-4">К списку досок</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/boards" className="hover:text-gray-700">Доски</Link>
            <span>/</span>
            <span className="text-gray-900">{board.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
          {board.description && (
            <p className="text-gray-600 mt-1">{board.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Добавить задачу</Button>
          <Button variant="ghost">Настройки</Button>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard boardId={board.id} />
    </div>
  );
}
