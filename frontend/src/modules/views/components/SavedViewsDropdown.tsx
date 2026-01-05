/**
 * SmartTask360 — Saved Views Dropdown Component
 *
 * Dropdown menu for selecting and managing saved filter views.
 */

import { useState, useRef, useEffect } from "react";
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Input } from "../../../shared/ui";
import { useViews, useCreateView, useUpdateView, useDeleteView } from "../hooks";
import type { UserView } from "../types";
import type { TaskFilters } from "../../tasks";

interface SavedViewsDropdownProps {
  currentFilters: TaskFilters;
  onApplyView: (filters: TaskFilters) => void;
}

export function SavedViewsDropdown({
  currentFilters,
  onApplyView,
}: SavedViewsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [viewName, setViewName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [editingView, setEditingView] = useState<UserView | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: views = [], isLoading } = useViews("task");
  const createView = useCreateView();
  const updateView = useUpdateView();
  const deleteView = useDeleteView();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyView = (view: UserView) => {
    onApplyView(view.filters);
    setIsOpen(false);
  };

  const handleSaveView = async () => {
    if (!viewName.trim()) return;

    try {
      if (editingView) {
        await updateView.mutateAsync({
          viewId: editingView.id,
          data: {
            name: viewName.trim(),
            filters: currentFilters,
            is_default: isDefault,
          },
        });
      } else {
        await createView.mutateAsync({
          name: viewName.trim(),
          filters: currentFilters,
          view_type: "task",
          is_default: isDefault,
        });
      }
      setIsSaveModalOpen(false);
      setViewName("");
      setIsDefault(false);
      setEditingView(null);
    } catch (error) {
      console.error("Failed to save view:", error);
    }
  };

  const handleEditView = (view: UserView, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingView(view);
    setViewName(view.name);
    setIsDefault(view.is_default);
    setIsSaveModalOpen(true);
    setIsOpen(false);
  };

  const handleDeleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Удалить это представление?")) {
      try {
        await deleteView.mutateAsync(viewId);
      } catch (error) {
        console.error("Failed to delete view:", error);
      }
    }
  };

  const handleOpenSaveModal = () => {
    setEditingView(null);
    setViewName("");
    setIsDefault(false);
    setIsSaveModalOpen(true);
    setIsOpen(false);
  };

  const hasActiveFilters = Object.keys(currentFilters).some(
    (key) => currentFilters[key as keyof TaskFilters] !== undefined
  );

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
          Виды
          {views.length > 0 && (
            <span className="ml-1 text-xs text-gray-500">({views.length})</span>
          )}
        </Button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Сохранённые виды
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={handleOpenSaveModal}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Сохранить текущий
                  </button>
                )}
              </div>
            </div>

            {/* Views List */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Загрузка...
                </div>
              ) : views.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  <p>Нет сохранённых видов</p>
                  {hasActiveFilters && (
                    <button
                      onClick={handleOpenSaveModal}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Сохранить текущие фильтры
                    </button>
                  )}
                </div>
              ) : (
                views.map((view) => (
                  <div
                    key={view.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                    onClick={() => handleApplyView(view)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {view.is_default && (
                        <svg
                          className="h-4 w-4 text-yellow-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      <span className="text-sm text-gray-700 truncate">
                        {view.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditView(view, e)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Редактировать"
                      >
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
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteView(view.id, e)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Удалить"
                      >
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
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {views.length > 0 && hasActiveFilters && (
              <div className="px-3 py-2 border-t border-gray-100">
                <button
                  onClick={handleOpenSaveModal}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Сохранить текущие фильтры как новый вид
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save View Modal */}
      <Modal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setEditingView(null);
          setViewName("");
          setIsDefault(false);
        }}
        size="sm"
      >
        <ModalHeader
          onClose={() => {
            setIsSaveModalOpen(false);
            setEditingView(null);
          }}
        >
          {editingView ? "Редактировать представление" : "Сохранить представление"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название
              </label>
              <Input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="Например: Мои срочные задачи"
                autoFocus
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Сделать видом по умолчанию
              </span>
            </label>

            {/* Preview of filters */}
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Текущие фильтры:
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(currentFilters).map(([key, value]) => {
                  if (value === undefined) return null;
                  return (
                    <div key={key}>
                      <span className="font-medium">{key}:</span>{" "}
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </div>
                  );
                })}
                {!hasActiveFilters && (
                  <span className="text-gray-400 italic">Нет активных фильтров</span>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsSaveModalOpen(false);
              setEditingView(null);
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSaveView}
            disabled={!viewName.trim() || createView.isPending || updateView.isPending}
          >
            {createView.isPending || updateView.isPending
              ? "Сохранение..."
              : editingView
              ? "Обновить"
              : "Сохранить"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
