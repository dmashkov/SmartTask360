/**
 * SmartTask360 — History section for task detail page
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Spinner } from "../../../shared/ui";
import { useTaskHistory } from "../hooks/useTaskHistory";
import { HistoryItem } from "./HistoryItem";

interface HistorySectionProps {
  taskId: string;
}

export function HistorySection({ taskId }: HistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: history = [], isLoading } = useTaskHistory(taskId);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <CardTitle>
              История {history.length > 0 && `(${history.length})`}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : history.length > 0 ? (
            <div className="border-l-2 border-gray-200 ml-1 pl-2">
              {history.map((entry) => (
                <HistoryItem key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-2">История пуста</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
