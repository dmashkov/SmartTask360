/**
 * SmartTask360 — Conversation Viewer Component
 *
 * Human-readable display for AI conversations based on type:
 * - smart_validation: SMARTValidationCard + summary
 * - smart_wizard: Wizard flow summary
 * - dialog: Chat-style messages
 *
 * All types include collapsible "Details" section with raw messages.
 */

import { useState } from "react";
import type { AIConversationWithMessages, AIMessage, SMARTValidationResult } from "../types";
import { SMARTValidationCard } from "./SMARTValidationCard";

interface ConversationViewerProps {
  conversation: AIConversationWithMessages;
}

export function ConversationViewer({ conversation }: ConversationViewerProps) {
  const { conversation_type, messages, result, context } = conversation;

  // Render based on conversation type
  if (conversation_type === "smart_validation") {
    return <SMARTValidationView result={result} messages={messages} />;
  }

  if (conversation_type === "smart_wizard") {
    return <SMARTWizardView result={result} context={context} messages={messages} />;
  }

  // Default: dialog view (clarify, decompose, estimate, etc.)
  return <DialogView messages={messages} context={context} />;
}

// ============================================================================
// SMART Validation View
// ============================================================================

function SMARTValidationView({
  result,
  messages,
}: {
  result: Record<string, unknown> | null;
  messages: AIMessage[];
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Try to parse result as SMARTValidationResult
  const validation = result as SMARTValidationResult | null;

  if (!validation) {
    // Fallback: try to extract from AI message
    const aiMessage = messages.find((m) => m.role === "assistant");
    if (aiMessage) {
      try {
        const parsed = JSON.parse(aiMessage.content);
        return (
          <div className="space-y-4">
            <SMARTValidationCard validation={parsed} showApplyButton={false} />
            <DetailsSection messages={messages} showDetails={showDetails} setShowDetails={setShowDetails} />
          </div>
        );
      } catch {
        // If can't parse, show as text
        return <DialogView messages={messages} context={null} />;
      }
    }
    return <div className="text-gray-500 text-sm">Нет данных для отображения</div>;
  }

  return (
    <div className="space-y-4">
      <SMARTValidationCard validation={validation} showApplyButton={false} />
      <DetailsSection messages={messages} showDetails={showDetails} setShowDetails={setShowDetails} />
    </div>
  );
}

// ============================================================================
// SMART Wizard View
// ============================================================================

function SMARTWizardView({
  result,
  context,
  messages,
}: {
  result: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  messages: AIMessage[];
}) {
  const [showDetails, setShowDetails] = useState(false);

  const wizardResult = result as {
    proposal?: {
      title?: string;
      description?: string;
      definition_of_done?: string[];
      smart_scores?: SMARTValidationResult;
    };
    changes_applied?: string[];
  } | null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
          <span className="font-medium text-purple-900">SMART-мастер</span>
        </div>
        <p className="text-sm text-purple-700">
          Интерактивный мастер помог улучшить формулировку задачи по SMART-критериям.
        </p>
      </div>

      {/* Changes applied */}
      {wizardResult?.changes_applied && wizardResult.changes_applied.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Применённые изменения:</h4>
          <ul className="space-y-1">
            {wizardResult.changes_applied.map((change, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SMART scores if available */}
      {wizardResult?.proposal?.smart_scores && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Итоговая SMART-оценка:</h4>
          <SMARTValidationCard validation={wizardResult.proposal.smart_scores} showApplyButton={false} />
        </div>
      )}

      {/* Collapsible details */}
      <DetailsSection messages={messages} showDetails={showDetails} setShowDetails={setShowDetails} />
    </div>
  );
}

// ============================================================================
// Dialog View (default)
// ============================================================================

function DialogView({
  messages,
  context,
}: {
  messages: AIMessage[];
  context: Record<string, unknown> | null;
}) {
  // Get dialog type label
  const dialogType = context?.dialog_type as string | undefined;
  const dialogLabels: Record<string, string> = {
    clarify: "Уточнение требований",
    decompose: "Декомпозиция задачи",
    estimate: "Оценка трудозатрат",
    general: "Общий диалог",
  };
  const dialogLabel = dialogType ? dialogLabels[dialogType] || dialogType : "Диалог с AI";

  // Filter out system messages and empty messages
  const displayMessages = messages.filter(
    (m) => m.role !== "system" && m.content.trim()
  );

  return (
    <div className="space-y-3">
      {/* Dialog type header */}
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {dialogLabel}
      </div>

      {/* Messages */}
      {displayMessages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {displayMessages.length === 0 && (
        <div className="text-gray-500 text-sm text-center py-4">
          Нет сообщений в диалоге
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Extract JSON from content (handles markdown blocks and raw JSON)
// ============================================================================

function extractJSON(content: string): unknown {
  let jsonStr = content.trim();

  // Try to extract from markdown code blocks
  const jsonBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    jsonStr = jsonBlockMatch[1].trim();
  }

  // Try to find JSON object in the text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// ============================================================================
// Message Bubble
// ============================================================================

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Try to parse JSON content for assistant messages
  if (isAssistant) {
    const parsed = extractJSON(message.content);
    if (parsed && typeof parsed === "object") {
      const data = parsed as Record<string, unknown>;

      // Check if it's a SMART validation result
      if (data.overall_score !== undefined && data.criteria) {
        return (
          <div className="mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <SMARTValidationCard validation={data as unknown as SMARTValidationResult} showApplyButton={false} />
          </div>
        );
      }

      // Check if it's a decomposition response (main_stages)
      if (data.main_stages && Array.isArray(data.main_stages)) {
        return (
          <div className="mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <DecompositionView data={data as unknown as DecompositionData} />
          </div>
        );
      }

      // Check if it's a wizard analyze response
      if (data.initial_assessment && data.questions) {
        return (
          <div className="p-3 rounded-lg bg-white border border-gray-200 mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <div className="text-sm whitespace-pre-wrap">{String(data.initial_assessment)}</div>
          </div>
        );
      }

      // Other structured responses - try to extract meaningful text
      if (data.summary) {
        return (
          <div className="p-3 rounded-lg bg-white border border-gray-200 mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <div className="text-sm whitespace-pre-wrap">{String(data.summary)}</div>
          </div>
        );
      }

      // Generic JSON - render as formatted structure
      return (
        <div className="mr-8">
          <div className="text-xs text-gray-500 mb-1">AI</div>
          <GenericJsonView data={data} />
        </div>
      );
    }
  }

  return (
    <div
      className={`p-3 rounded-lg ${
        isUser
          ? "bg-blue-100 ml-8"
          : "bg-white border border-gray-200 mr-8"
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">
        {isUser ? "Вы" : "AI"}
      </div>
      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
    </div>
  );
}

// ============================================================================
// Decomposition View (for main_stages structure)
// ============================================================================

interface DecompositionStage {
  id?: number;
  title: string;
  subtasks?: string[];
  description?: string;
  estimated_hours?: number;
  blockers?: string[];
}

interface DecompositionData {
  main_stages: DecompositionStage[];
  summary?: string;
  total_estimate?: string;
}

function DecompositionView({ data }: { data: DecompositionData }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {data.summary && (
        <p className="text-sm text-gray-700">{data.summary}</p>
      )}

      <div className="space-y-3">
        {data.main_stages.map((stage, index) => (
          <div key={stage.id || index} className="border-l-4 border-blue-400 pl-3 py-1">
            <div className="font-medium text-gray-900">
              {stage.id ? `${stage.id}. ` : `${index + 1}. `}
              {stage.title}
            </div>

            {stage.description && (
              <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
            )}

            {stage.estimated_hours && (
              <div className="text-xs text-gray-500 mt-1">
                Оценка: {stage.estimated_hours} ч
              </div>
            )}

            {stage.subtasks && stage.subtasks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {stage.subtasks.map((subtask, subIndex) => (
                  <li key={subIndex} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {subtask}
                  </li>
                ))}
              </ul>
            )}

            {stage.blockers && stage.blockers.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-red-600 font-medium">Блокеры:</span>
                <ul className="mt-1 space-y-1">
                  {stage.blockers.map((blocker, bIndex) => (
                    <li key={bIndex} className="text-sm text-red-600 flex items-start gap-2">
                      <span>!</span>
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {data.total_estimate && (
        <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
          <span className="font-medium">Общая оценка:</span> {data.total_estimate}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Generic JSON View (for unknown structures)
// ============================================================================

function GenericJsonView({ data }: { data: Record<string, unknown> }) {
  // Try to render in a human-friendly way
  const renderValue = (value: unknown, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400">—</span>;

    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value ? "Да" : "Нет";

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">—</span>;
      // Check if array of strings
      if (value.every((v) => typeof v === "string")) {
        return (
          <ul className="space-y-1 mt-1">
            {value.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        );
      }
      // Array of objects
      return (
        <div className="space-y-2 mt-1">
          {value.map((item, i) => (
            <div key={i} className="pl-3 border-l-2 border-gray-200">
              {typeof item === "object" ? renderValue(item, depth + 1) : String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return (
        <div className={depth > 0 ? "pl-3 border-l-2 border-gray-200 space-y-2" : "space-y-2"}>
          {Object.entries(obj).map(([key, val]) => (
            <div key={key}>
              <span className="font-medium text-gray-700">{formatKey(key)}:</span>{" "}
              <span className="text-gray-600">{renderValue(val, depth + 1)}</span>
            </div>
          ))}
        </div>
      );
    }

    return String(value);
  };

  const formatKey = (key: string): string => {
    // Convert snake_case to human-readable
    const translations: Record<string, string> = {
      main_stages: "Основные этапы",
      subtasks: "Подзадачи",
      title: "Название",
      description: "Описание",
      estimated_hours: "Оценка (ч)",
      blockers: "Блокеры",
      summary: "Резюме",
      total_estimate: "Общая оценка",
      risks: "Риски",
      recommendations: "Рекомендации",
      overall_risk_level: "Уровень риска",
    };
    return translations[key] || key.replace(/_/g, " ");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
      {renderValue(data)}
    </div>
  );
}

// ============================================================================
// Details Section (collapsible raw messages)
// ============================================================================

function DetailsSection({
  messages,
  showDetails,
  setShowDetails,
}: {
  messages: AIMessage[];
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
}) {
  // Filter out system messages
  const displayMessages = messages.filter((m) => m.role !== "system");

  if (displayMessages.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showDetails ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Детали диалога ({displayMessages.length} сообщений)
      </button>

      {showDetails && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {displayMessages.map((msg, index) => (
            <RawMessageItem key={msg.id || index} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}

// Raw message item for details section
function RawMessageItem({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";

  // Truncate very long messages
  let content = message.content;
  const maxLength = 500;
  const isTruncated = content.length > maxLength;
  if (isTruncated) {
    content = content.substring(0, maxLength) + "...";
  }

  return (
    <div
      className={`p-2 rounded text-xs ${
        isUser ? "bg-blue-50 border-l-2 border-blue-300" : "bg-gray-50 border-l-2 border-gray-300"
      }`}
    >
      <div className="font-medium text-gray-600 mb-1">
        {isUser ? "Пользователь" : "AI"}
      </div>
      <div className="text-gray-700 whitespace-pre-wrap font-mono">{content}</div>
      {isTruncated && (
        <div className="text-gray-400 italic mt-1">(сообщение обрезано)</div>
      )}
    </div>
  );
}
