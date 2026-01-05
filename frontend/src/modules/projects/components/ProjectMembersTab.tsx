/**
 * SmartTask360 — Project Members Tab
 * Displays and manages project members
 */

import { useState } from "react";
import { Spinner, Avatar, EmptyState } from "../../../shared/ui";
import {
  useProjectMembers,
  useUpdateProjectMember,
  useRemoveProjectMember,
} from "../hooks";
import type { ProjectMemberWithUser, ProjectMemberRole } from "../types";

interface ProjectMembersTabProps {
  projectId: string;
  isOwner?: boolean;
}

const roleLabels: Record<ProjectMemberRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

const roleColors: Record<ProjectMemberRole, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-700",
  viewer: "bg-gray-50 text-gray-500",
};

function MemberRow({
  member,
  canManage,
  onChangeRole,
  onRemove,
}: {
  member: ProjectMemberWithUser;
  canManage: boolean;
  onChangeRole: (role: ProjectMemberRole) => void;
  onRemove: () => void;
}) {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const isOwner = member.role === "owner";

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
      {/* Avatar */}
      <Avatar name={member.user_name || member.user_email} size="md" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {member.user_name || "Без имени"}
        </div>
        <div className="text-sm text-gray-500 truncate">{member.user_email}</div>
      </div>

      {/* Role */}
      {isEditingRole && canManage && !isOwner ? (
        <select
          value={member.role}
          onChange={(e) => {
            onChangeRole(e.target.value as ProjectMemberRole);
            setIsEditingRole(false);
          }}
          onBlur={() => setIsEditingRole(false)}
          autoFocus
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="admin">Администратор</option>
          <option value="member">Участник</option>
          <option value="viewer">Наблюдатель</option>
        </select>
      ) : (
        <button
          onClick={() => canManage && !isOwner && setIsEditingRole(true)}
          disabled={!canManage || isOwner}
          className={`text-xs px-2 py-1 rounded ${roleColors[member.role]} ${
            canManage && !isOwner ? "cursor-pointer hover:opacity-80" : ""
          }`}
          title={canManage && !isOwner ? "Нажмите для изменения роли" : undefined}
        >
          {roleLabels[member.role]}
        </button>
      )}

      {/* Remove button */}
      {canManage && !isOwner && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Удалить из проекта"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function ProjectMembersTab({ projectId, isOwner = false }: ProjectMembersTabProps) {
  const { data: members = [], isLoading, error } = useProjectMembers(projectId);
  const updateMember = useUpdateProjectMember();
  const removeMember = useRemoveProjectMember();

  const handleChangeRole = async (userId: string, role: ProjectMemberRole) => {
    try {
      await updateMember.mutateAsync({
        projectId,
        userId,
        data: { role },
      });
    } catch (err) {
      console.error("Failed to update member role:", err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Вы уверены, что хотите удалить участника из проекта?")) {
      return;
    }

    try {
      await removeMember.mutateAsync({ projectId, userId });
    } catch (err) {
      console.error("Failed to remove member:", err);
    }
  };

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
        Ошибка загрузки участников
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        title="Нет участников"
        description="В проекте пока нет участников"
      />
    );
  }

  // Sort: owner first, then admins, then members, then viewers
  const sortedMembers = [...members].sort((a, b) => {
    const order = { owner: 0, admin: 1, member: 2, viewer: 3 };
    return order[a.role] - order[b.role];
  });

  return (
    <div>
      {/* Members list */}
      <div className="divide-y divide-gray-100">
        {sortedMembers.map((member) => (
          <MemberRow
            key={member.user_id}
            member={member}
            canManage={isOwner}
            onChangeRole={(role) => handleChangeRole(member.user_id, role)}
            onRemove={() => handleRemoveMember(member.user_id)}
          />
        ))}
      </div>

      {/* Footer with stats */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
        Всего участников: {members.length}
      </div>
    </div>
  );
}
