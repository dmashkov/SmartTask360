/**
 * SmartTask360 — Invite Member Modal
 *
 * Modal for adding new members to a project.
 */

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "../../../shared/ui";
import { UserSelect } from "../../users";
import { useAddProjectMember } from "../hooks";
import type { ProjectMemberRole } from "../types";
import type { User } from "../../users";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  /** IDs of users already in the project */
  existingMemberIds: string[];
}

const roleOptions: { value: ProjectMemberRole; label: string; description: string }[] = [
  {
    value: "admin",
    label: "Администратор",
    description: "Полный доступ к настройкам проекта и управлению участниками",
  },
  {
    value: "member",
    label: "Участник",
    description: "Может создавать и редактировать задачи",
  },
  {
    value: "viewer",
    label: "Наблюдатель",
    description: "Только просмотр задач и информации о проекте",
  },
];

export function InviteMemberModal({
  isOpen,
  onClose,
  projectId,
  existingMemberIds,
}: InviteMemberModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProjectMemberRole>("member");
  const [error, setError] = useState<string | null>(null);

  const addMember = useAddProjectMember();

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedRole("member");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError("Выберите пользователя");
      return;
    }

    setError(null);

    try {
      await addMember.mutateAsync({
        projectId,
        data: {
          user_id: selectedUser.id,
          role: selectedRole,
        },
      });
      handleClose();
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || "Ошибка при добавлении участника";
      setError(message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader onClose={handleClose}>Пригласить участника</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* User select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пользователь
            </label>
            <UserSelect
              value={selectedUser?.id}
              onSelect={setSelectedUser}
              excludeIds={existingMemberIds}
              placeholder="Выберите пользователя"
              autoFocus
            />
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">{selectedUser.name}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
              </div>
            </div>
          )}

          {/* Role select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Роль в проекте
            </label>
            <div className="space-y-2">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selectedRole === option.value}
                    onChange={() => setSelectedRole(option.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedUser || addMember.isPending}
        >
          {addMember.isPending ? "Добавление..." : "Добавить"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
