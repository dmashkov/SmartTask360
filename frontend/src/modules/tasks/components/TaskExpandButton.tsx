import { cn } from "../../../shared/lib/utils";

interface TaskExpandButtonProps {
  isExpanded: boolean;
  isLoading?: boolean;
  childrenCount: number;
  onClick: () => void;
}

export function TaskExpandButton({
  isExpanded,
  isLoading = false,
  childrenCount,
  onClick,
}: TaskExpandButtonProps) {
  // Don't render anything if task has no children
  if (childrenCount === 0) {
    return <div className="w-5 h-5" />; // Placeholder for alignment
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "w-5 h-5 flex items-center justify-center rounded transition-colors",
        "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      )}
      title={isExpanded ? "Свернуть" : "Развернуть"}
    >
      {isLoading ? (
        <svg
          className="w-3 h-3 animate-spin"
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
      ) : (
        <svg
          className={cn(
            "w-3 h-3 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
