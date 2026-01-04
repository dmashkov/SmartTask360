/**
 * SmartTask360 — Project create/edit modal
 */

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
import { useCreateProject, useUpdateProject } from "../hooks";
import type { Project, ProjectStatus } from "../types";

const statusOptions = [
  { value: "planning", label: "Планирование" },
  { value: "active", label: "Активный" },
  { value: "on_hold", label: "На паузе" },
  { value: "completed", label: "Завершён" },
  { value: "archived", label: "Архив" },
];

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  project,
}: ProjectFormModalProps) {
  const isEdit = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name);
        setCode(project.code);
        setDescription(project.description || "");
        setStatus(project.status as ProjectStatus);
        setStartDate(project.start_date ? project.start_date.split("T")[0] : "");
        setDueDate(project.due_date ? project.due_date.split("T")[0] : "");
      } else {
        setName("");
        setCode("");
        setDescription("");
        setStatus("planning");
        setStartDate("");
        setDueDate("");
      }
    }
  }, [isOpen, project]);

  // Auto-generate code from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    // Only auto-generate code if not editing and code is empty
    if (!isEdit && !code) {
      const autoCode = newName
        .toUpperCase()
        .replace(/[^A-ZА-Я0-9]/gi, "")
        .slice(0, 10);
      if (autoCode) {
        setCode(autoCode);
      }
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      code,
      description: description || null,
      status,
      start_date: startDate ? `${startDate}T00:00:00` : null,
      due_date: dueDate ? `${dueDate}T23:59:59` : null,
    };

    try {
      if (isEdit && project) {
        await updateProject.mutateAsync({
          projectId: project.id,
          data,
        });
      } else {
        await createProject.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error("Ошибка сохранения проекта:", error);
    }
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          {isEdit ? "Редактирование проекта" : "Создание проекта"}
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label="Название"
                value={name}
                onChange={handleNameChange}
                placeholder="Введите название проекта"
                required
                autoFocus
              />
            </div>
            <Input
              label="Код"
              value={code}
              onChange={handleCodeChange}
              placeholder="PROJ-01"
              required
              maxLength={20}
            />
          </div>

          <Textarea
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание проекта (необязательно)"
            rows={3}
          />

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Статус"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            />

            <Input
              label="Дата начала"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="Дедлайн"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
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
