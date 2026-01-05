import { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
} from "../../../shared/ui";
import { useCreateTask, useUpdateTask } from "../hooks";
import type { Task, TaskCreate, TaskUpdate, TaskPriority } from "../types";
import { useUsers } from "../../users";
import { useAuth } from "../../auth";
import { ProjectSelect, NO_PROJECT_VALUE } from "../../projects";
import { uploadDocument } from "../../documents/api";

const priorityOptions = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критический" },
];

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  parentId?: string | null;
  defaultProjectId?: string | null;
}

interface SelectedFile {
  file: File;
  id: string;
}

export function TaskFormModal({ isOpen, onClose, task, parentId, defaultProjectId }: TaskFormModalProps) {
  const isEdit = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: users = [] } = useUsers();
  const { user: currentUser } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [creatorId, setCreatorId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build user options for select
  const userOptions = [
    { value: "", label: "Не выбран" },
    ...users.map((user) => ({
      value: user.id,
      label: user.name,
    })),
  ];

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode: load task values
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority);
        setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
        setEstimatedHours(task.estimated_hours?.toString() || "");
        setCreatorId(task.creator_id || "");
        setAssigneeId(task.assignee_id || "");
        // For project: if task has no project, use NO_PROJECT_VALUE marker
        setProjectId(task.project_id || NO_PROJECT_VALUE);
        setSelectedFiles([]);
      } else {
        // Create mode: set defaults
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setEstimatedHours("");
        // Default creator and assignee to current user
        setCreatorId(currentUser?.id || "");
        setAssigneeId(currentUser?.id || "");
        // Default project: if provided use it, otherwise "Без проекта"
        setProjectId(defaultProjectId || NO_PROJECT_VALUE);
        setSelectedFiles([]);
      }
    }
  }, [isOpen, task, defaultProjectId, currentUser]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = Array.from(files).map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Б";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Format due_date - send date as-is without timezone conversion
    let formattedDueDate = null;
    if (dueDate) {
      // dueDate is "YYYY-MM-DD", send as "YYYY-MM-DDTHH:MM:SS"
      // Use end of day in local time
      formattedDueDate = `${dueDate}T23:59:59`;
    }

    const data = {
      title,
      description: description || null,
      priority,
      due_date: formattedDueDate,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      parent_id: parentId || null,
      creator_id: creatorId || null,
      assignee_id: assigneeId || null,
      // Convert NO_PROJECT_VALUE marker to null for API
      project_id: projectId === NO_PROJECT_VALUE ? null : (projectId || null),
    };

    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({
          taskId: task.id,
          data: data as TaskUpdate,
        });

        // Upload files if any (for edit mode)
        if (selectedFiles.length > 0) {
          for (const { file } of selectedFiles) {
            await uploadDocument(task.id, file, undefined, "attachment");
          }
        }

        onClose();
      } else {
        // Create task first
        const newTask = await createTask.mutateAsync(data as TaskCreate);

        // Upload files as "requirement" type if any
        if (selectedFiles.length > 0 && newTask?.id) {
          for (const { file } of selectedFiles) {
            await uploadDocument(newTask.id, file, undefined, "requirement");
          }
        }

        onClose();
      }
    } catch (error) {
      console.error("Ошибка сохранения задачи:", error);
    }
  };

  const isLoading = createTask.isPending || updateTask.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          {isEdit ? "Редактирование задачи" : "Создание задачи"}
        </ModalHeader>

        <ModalBody className="space-y-4">
          <Input
            label="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название задачи"
            required
            autoFocus
          />

          <Textarea
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание задачи (необязательно)"
            rows={4}
          />

          <ProjectSelect
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            allowEmpty={false}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Постановщик"
              options={userOptions}
              value={creatorId}
              onChange={(e) => setCreatorId(e.target.value)}
            />

            <Select
              label="Исполнитель"
              options={userOptions}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Приоритет"
              options={priorityOptions}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            />

            <Input
              label="Срок выполнения"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Input
            label="Оценка времени (часы)"
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
          />

          {/* File upload section - only for create mode */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Исходные материалы (опционально)
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors w-full justify-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-gray-600">Выбрать файлы</span>
              </button>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map(({ file, id }) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">
                          ({formatFileSize(file.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
