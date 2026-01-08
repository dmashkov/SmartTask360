/**
 * SmartTask360 — AI Chat Component
 *
 * Interactive chat interface for AI dialogs:
 * - clarify: Clarify task requirements
 * - decompose: Break down into subtasks
 * - estimate: Estimate effort
 * - general: Open discussion
 */

import { useState, useRef, useEffect } from "react";
import { Button, Spinner } from "../../../shared/ui";
import type { AIMessage, DialogType } from "../types";

// Dialog type configuration
const DIALOG_CONFIG: Record<DialogType, { title: string; icon: string; color: string; placeholder: string }> = {
  clarify: {
    title: "Уточнение требований",
    icon: "?",
    color: "blue",
    placeholder: "Задайте вопрос для уточнения...",
  },
  decompose: {
    title: "Декомпозиция задачи",
    icon: "📋",
    color: "purple",
    placeholder: "Обсудите разбиение на подзадачи...",
  },
  technical: {
    title: "Техническое решение",
    icon: "🔧",
    color: "indigo",
    placeholder: "Обсудите архитектуру и подход...",
  },
  testing: {
    title: "Тестирование",
    icon: "🧪",
    color: "green",
    placeholder: "Обсудите тест-кейсы и сценарии...",
  },
  general: {
    title: "Обсуждение задачи",
    icon: "💬",
    color: "gray",
    placeholder: "Напишите сообщение...",
  },
};

interface AIChatProps {
  dialogType: DialogType;
  messages: AIMessage[];
  isLoading?: boolean;
  isSending?: boolean;
  onSendMessage: (content: string) => void;
  onComplete?: () => void;
  onClose: () => void;
}

export function AIChat({
  dialogType,
  messages,
  isLoading = false,
  isSending = false,
  onSendMessage,
  onComplete,
  onClose,
}: AIChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = DIALOG_CONFIG[dialogType];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input.trim());
      setInput("");
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "40px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Filter out system messages for display
  const displayMessages = messages.filter((m) => m.role !== "system");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-${config.color}-50`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{config.title}</h3>
            <p className="text-xs text-gray-500">AI-ассистент поможет с задачей</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-500">AI анализирует задачу...</span>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Начните диалог с AI-ассистентом</p>
          </div>
        ) : (
          displayMessages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm">AI думает...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize textarea
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder}
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[40px] max-h-[150px] overflow-y-auto"
            disabled={isSending}
            style={{ height: "40px" }}
          />
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={!input.trim() || isSending}
              className="px-4 h-10"
            >
              {isSending ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
            {onComplete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onComplete}
                disabled={isSending || displayMessages.length < 2}
                title="Завершить диалог"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enter — отправить, Shift+Enter — новая строка
        </p>
      </form>
    </div>
  );
}

// Decomposition stage type (used by both DecompositionResponse and DecompositionCard)
interface DecompositionStage {
  id?: number;
  title: string;
  subtasks?: string[];
  description?: string;
  estimated_hours?: number;
  blockers?: string[];
}

// Type for decomposition response
interface DecompositionResponse {
  main_stages: DecompositionStage[];
  total_estimate?: string;
}

// Type guard for decomposition response
function isDecompositionResponse(obj: unknown): obj is DecompositionResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "main_stages" in obj &&
    Array.isArray((obj as DecompositionResponse).main_stages)
  );
}

// Type for generic JSON with summary/message
interface SummaryResponse {
  summary?: string;
  message?: string;
  initial_assessment?: string;
}

// Type guard for summary response
function isSummaryResponse(obj: unknown): obj is SummaryResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("summary" in obj || "message" in obj || "initial_assessment" in obj)
  );
}

// Extract JSON from content (handles markdown blocks and raw JSON)
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

// Individual chat message component
function ChatMessage({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";

  // Try to parse JSON for assistant messages
  if (!isUser) {
    const parsed = extractJSON(message.content);

    // Check if it's a decomposition response (main_stages)
    if (isDecompositionResponse(parsed)) {
      return (
        <div className="flex justify-start">
          <div className="max-w-[90%]">
            <div className="flex items-center gap-1 mb-2">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-xs font-medium text-purple-600">AI</span>
            </div>
            <DecompositionCard data={parsed} />
            <div className="text-xs text-gray-400 mt-1">
              {new Date(message.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      );
    }

    // Other JSON - try to render nicely
    if (isSummaryResponse(parsed)) {
      const text = parsed.summary || parsed.message || parsed.initial_assessment;
      return (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-lg px-4 py-3 bg-white border border-gray-200 text-gray-800">
            <div className="flex items-center gap-1 mb-1">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-xs font-medium text-purple-600">AI</span>
            </div>
            <div className="text-sm whitespace-pre-wrap text-gray-700">{text}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(message.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        {/* Role label for assistant */}
        {!isUser && (
          <div className="flex items-center gap-1 mb-1">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            <span className="text-xs font-medium text-purple-600">AI</span>
          </div>
        )}

        {/* Message content */}
        <div className={`text-sm whitespace-pre-wrap ${isUser ? "" : "text-gray-700"}`}>
          {formatMessageContent(message.content)}
        </div>

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${isUser ? "text-blue-200" : "text-gray-400"}`}>
          {new Date(message.created_at).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

// Decomposition Card for structured subtasks display
function DecompositionCard({ data }: { data: DecompositionResponse }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
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

      {data.total_estimate && (
        <div className="pt-3 border-t border-gray-200 text-sm text-gray-600">
          <span className="font-medium">Общая оценка:</span> {data.total_estimate}
        </div>
      )}
    </div>
  );
}

// Format message content (handle markdown-like formatting)
function formatMessageContent(content: string): React.ReactNode {
  // Try to parse JSON responses for structured display
  if (content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      // If it has a summary or message field, show that
      if (parsed.summary) return parsed.summary;
      if (parsed.message) return parsed.message;
      // Otherwise show formatted
      return content;
    } catch {
      // Not JSON, show as-is
    }
  }

  return content;
}
