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
// Message Bubble
// ============================================================================

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  // Try to parse JSON content for assistant messages
  let displayContent = message.content;
  let isStructured = false;

  if (isAssistant && message.content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(message.content);
      // Check if it's a SMART validation result
      if (parsed.overall_score !== undefined && parsed.criteria) {
        return (
          <div className="mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <SMARTValidationCard validation={parsed as SMARTValidationResult} showApplyButton={false} />
          </div>
        );
      }
      // Check if it's a wizard analyze response
      if (parsed.initial_assessment && parsed.questions) {
        isStructured = true;
        displayContent = parsed.initial_assessment;
      }
      // Other structured responses - try to extract meaningful text
      if (parsed.summary) {
        displayContent = parsed.summary;
        isStructured = true;
      }
    } catch {
      // Not JSON, display as-is
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
      <div className="text-sm whitespace-pre-wrap">{displayContent}</div>
      {isStructured && (
        <div className="mt-2 text-xs text-gray-400 italic">
          (структурированный ответ)
        </div>
      )}
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
