import { useState, useEffect } from "react";
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
}

export function TaskFormModal({ isOpen, onClose, task, parentId }: TaskFormModalProps) {
  const isEdit = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || "");
        setPriority(task.priority);
        setDueDate(task.due_date ? task.due_date.split("T")[0] : "");
        setEstimatedHours(task.estimated_hours?.toString() || "");
      } else {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setEstimatedHours("");
      }
    }
  }, [isOpen, task]);

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
    };

    try {
      if (isEdit && task) {
        await updateTask.mutateAsync({
          taskId: task.id,
          data: data as TaskUpdate,
        });
      } else {
        await createTask.mutateAsync(data as TaskCreate);
      }
      onClose();
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
