import { Link } from "react-router-dom";
import { useTask } from "../hooks/useTask";

interface ParentTaskLinkProps {
  parentId: string;
}

export function ParentTaskLink({ parentId }: ParentTaskLinkProps) {
  const { data: parent, isLoading } = useTask(parentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span>Загрузка...</span>
      </div>
    );
  }

  if (!parent) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm mb-4 bg-gray-50 rounded-lg px-3 py-2">
      <svg
        className="w-4 h-4 text-gray-400 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
        />
      </svg>
      <span className="text-gray-500">Родительская задача:</span>
      <Link
        to={`/tasks/${parent.id}`}
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate"
      >
        {parent.title}
      </Link>
    </div>
  );
}
