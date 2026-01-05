/**
 * SmartTask360 — Task Detail Tabs
 * Tabs for Comments, History, and Documents sections
 */

import { useState } from "react";
import { CommentsSection } from "../../comments";
import { HistorySection } from "../../task-history";
import { DocumentsSection } from "../../documents";

type TabId = "comments" | "history" | "documents";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: "comments",
    label: "Комментарии",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "История",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "documents",
    label: "Документы",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

interface TaskDetailTabsProps {
  taskId: string;
}

export function TaskDetailTabs({ taskId }: TaskDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("comments");

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Tab Headers */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === "comments" && (
          <CommentsSection taskId={taskId} embedded />
        )}
        {activeTab === "history" && (
          <HistorySection taskId={taskId} embedded />
        )}
        {activeTab === "documents" && (
          <DocumentsSection taskId={taskId} embedded />
        )}
      </div>
    </div>
  );
}
