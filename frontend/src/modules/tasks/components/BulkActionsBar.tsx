import { useState, useRef, useEffect } from "react";
import { Button, Select, Modal, ModalHeader, ModalBody, ModalFooter } from "../../../shared/ui";
import type { TaskStatus, TaskPriority } from "../types";
import type { User } from "../../users";

type BulkActionType = "status" | "priority" | "assignee" | "delete";

const statusOptions = [
  { value: "new", label: "Новая" },
  { value: "assigned", label: "Назначена" },
  { value: "in_progress", label: "В работе" },
  { value: "in_review", label: "На проверке" },
  { value: "on_hold", label: "На паузе" },
  { value: "done", label: "Готово" },
];

const priorityOptions = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критический" },
];

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  users?: User[];
}

export function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDelete,
  onClearSelection,
  isLoading = false,
  users = [],
}: BulkActionsBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<BulkActionType | null>(null);
  const [selectedValue, setSelectedValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  const getDefaultValue = (type: BulkActionType): string => {
    switch (type) {
      case "status":
        return statusOptions[0].value;
      case "priority":
        return priorityOptions[0].value;
      case "assignee":
        return ""; // "Снять исполнителя" по умолчанию
      default:
        return "";
    }
  };

  const openModal = (type: BulkActionType) => {
    setIsMenuOpen(false);
    setSelectedValue(getDefaultValue(type));
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedValue("");
  };

  const handleApply = () => {
    if (!activeModal) return;

    switch (activeModal) {
      case "status":
        if (selectedValue) {
          onStatusChange(selectedValue as TaskStatus);
        }
        break;
      case "priority":
        if (selectedValue) {
          onPriorityChange(selectedValue as TaskPriority);
        }
        break;
      case "assignee":
        // selectedValue can be empty string for "unassign"
        onAssigneeChange(selectedValue || null);
        break;
      case "delete":
        onDelete();
        break;
    }
    closeModal();
  };

  const userOptions = [
    { value: "", label: "Снять исполнителя" },
    ...users.map((user) => ({ value: user.id, label: user.name })),
  ];

  const getModalTitle = () => {
    switch (activeModal) {
      case "status":
        return "Изменить статус";
      case "priority":
        return "Изменить приоритет";
      case "assignee":
        return "Изменить исполнителя";
      case "delete":
        return "Удалить задачи";
      default:
        return "";
    }
  };

  const canApply = () => {
    // Для всех типов кнопка активна - значение выбрано по умолчанию
    return true;
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-900 text-white rounded-lg shadow-xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">
            Выбрано: {selectedCount}
          </span>

          <div className="h-6 w-px bg-gray-700" />

          {/* Action Menu Button */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Действие
              <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Button>

            {isMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button
                  type="button"
                  onClick={() => openModal("status")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Изменить статус
                </button>
                <button
                  type="button"
                  onClick={() => openModal("priority")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21l3.75-3.75" />
                  </svg>
                  Изменить приоритет
                </button>
                <button
                  type="button"
                  onClick={() => openModal("assignee")}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Изменить исполнителя
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  type="button"
                  onClick={() => openModal("delete")}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Удалить задачи
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-gray-700" />

          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white transition-colors"
            title="Снять выделение"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal for bulk actions */}
      <Modal isOpen={!!activeModal} onClose={closeModal} size="sm">
        <ModalHeader onClose={closeModal}>{getModalTitle()}</ModalHeader>
        <ModalBody>
          {activeModal === "status" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Выберите новый статус для {selectedCount} задач:
              </p>
              <Select
                options={statusOptions}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {activeModal === "priority" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Выберите новый приоритет для {selectedCount} задач:
              </p>
              <Select
                options={priorityOptions}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {activeModal === "assignee" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Выберите нового исполнителя для {selectedCount} задач:
              </p>
              <Select
                options={userOptions}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {activeModal === "delete" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <svg className="h-6 w-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="font-medium text-red-800">
                    Вы уверены, что хотите удалить {selectedCount} задач?
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Это действие нельзя отменить.
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={closeModal}>
            Отмена
          </Button>
          <Button
            variant={activeModal === "delete" ? "danger" : "primary"}
            onClick={handleApply}
            disabled={!canApply() || isLoading}
          >
            {activeModal === "delete" ? "Удалить" : "Применить"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
