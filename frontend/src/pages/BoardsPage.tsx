import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  Loading,
  EmptyState,
  EmptyStateIcons,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
} from "../shared/ui";
import { formatDateTime } from "../shared/lib/utils";
import { useBoards, useCreateBoard } from "../modules/boards";
import type { BoardCreate } from "../modules/boards";

const templateOptions = [
  { value: "basic", label: "Базовый (Новая → В работе → На проверке → Готово)" },
  { value: "agile", label: "Agile (Бэклог → К выполнению → В работе → Ревью → Готово)" },
  { value: "approval", label: "Согласование (Черновик → На согласовании → Утверждено → Готово)" },
];

export function BoardsPage() {
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<"basic" | "agile" | "approval">("basic");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: BoardCreate = {
      name,
      description: description || null,
      template,
    };

    try {
      await createBoard.mutateAsync(data);
      setIsCreateModalOpen(false);
      setName("");
      setDescription("");
      setTemplate("basic");
    } catch (error) {
      console.error("Ошибка создания доски:", error);
    }
  };

  if (isLoading) {
    return <Loading message="Загрузка досок..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Доски</h1>
          <p className="text-gray-600 mt-1">Kanban-доски для визуального управления задачами</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Новая доска
        </Button>
      </div>

      {/* Boards Grid */}
      {boards && boards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link key={board.id} to={`/boards/${board.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg">{board.name}</h3>
                  {board.description && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-3">
                    Создана {formatDateTime(board.created_at)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={EmptyStateIcons.folder}
              title="Досок пока нет"
              description="Создайте первую Kanban-доску для визуального управления задачами"
              action={
                <Button onClick={() => setIsCreateModalOpen(true)}>Создать доску</Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <ModalHeader onClose={() => setIsCreateModalOpen(false)}>
            Создание доски
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Название доски"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              required
              autoFocus
            />
            <Textarea
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              rows={3}
            />
            <Select
              label="Шаблон"
              options={templateOptions}
              value={template}
              onChange={(e) => setTemplate(e.target.value as typeof template)}
            />
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" isLoading={createBoard.isPending}>
              Создать
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
