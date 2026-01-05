/**
 * SmartTask360 — Project row component for table view
 */

import { Link } from "react-router-dom";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { ProjectListItem } from "../types";

interface ProjectRowProps {
  project: ProjectListItem;
}

export function ProjectRow({ project }: ProjectRowProps) {
  const dueDateFormatted = project.due_date
    ? new Date(project.due_date).toLocaleDateString("ru-RU")
    : null;

  const isOverdue =
    project.due_date &&
    new Date(project.due_date) < new Date() &&
    project.status !== "completed" &&
    project.status !== "archived";

  return (
    <Link
      to={`/projects/${project.id}`}
      className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
    >
      {/* Code */}
      <div className="w-24 shrink-0">
        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {project.code}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0 pr-4">
        <span className="font-medium text-gray-900 truncate block">{project.name}</span>
      </div>

      {/* Status */}
      <div className="w-28 shrink-0">
        <ProjectStatusBadge status={project.status} />
      </div>

      {/* Tasks */}
      <div className="w-24 shrink-0 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <span>{project.task_count}</span>
        </div>
      </div>

      {/* Members */}
      <div className="w-20 shrink-0 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span>{project.member_count}</span>
        </div>
      </div>

      {/* Due Date */}
      <div className="w-28 shrink-0 text-sm">
        {dueDateFormatted ? (
          <span className={isOverdue ? "text-red-500" : "text-gray-500"}>
            {dueDateFormatted}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Arrow */}
      <div className="w-8 shrink-0 flex justify-end">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
