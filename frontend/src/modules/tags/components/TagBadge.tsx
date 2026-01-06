/**
 * SmartTask360 — Tag badge component
 * Displays a colored tag with name
 */

import type { Tag } from "../types";

interface TagBadgeProps {
  tag: Tag | { id: string; name: string; color: string };
  size?: "xs" | "sm" | "md";
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({ tag, size = "sm", onRemove, className = "" }: TagBadgeProps) {
  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  // Calculate text color based on background brightness
  const getTextColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#1f2937" : "#ffffff";
  };

  const textColor = getTextColor(tag.color);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: tag.color, color: textColor }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          style={{ color: textColor }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
