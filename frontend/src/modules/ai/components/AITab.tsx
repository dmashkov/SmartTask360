/**
 * SmartTask360 — AI Tab Component
 *
 * Main AI tab for task detail page with:
 * - Action buttons (SMART, Dialog dropdown, Risks)
 * - Conversation history list
 * - Conversation viewer/continuation modal
 */

import { useState, useMemo } from "react";
import { Button, Dropdown, DropdownItem, Spinner, Modal } from "../../../shared/ui";
import { formatDateTime } from "../../../shared/lib/utils";
import {
  useValidateSMART,
  useTaskConversations,
  useStartDialog,
  useConversationWithMessages,
  useSendMessage,
} from "../hooks";
import type {
  AIConversation,
  DialogType,
  SMARTValidationResult,
} from "../types";
import { SMARTValidationCard } from "./SMARTValidationCard";
import { SMARTWizard } from "./SMARTWizard";

// Dialog type labels
const DIALOG_TYPES: { value: DialogType; label: string; description: string }[] = [
  { value: "clarify", label: "Уточнить", description: "Уточнить требования и детали" },
  { value: "decompose", label: "Декомпозировать", description: "Разбить на подзадачи" },
  { value: "estimate", label: "Оценить трудозатраты", description: "Оценить время выполнения" },
];

// Conversation type labels
const CONVERSATION_TYPE_LABELS: Record<string, string> = {
  smart_validation: "SMART-анализ",
  task_dialog: "Диалог",
  risk_analysis: "Анализ рисков",
  clarify: "Уточнение",
  decompose: "Декомпозиция",
  estimate: "Оценка трудозатрат",
};

interface AITabProps {
  taskId: string;
  currentSmartScore?: SMARTValidationResult | null;
  smartValidatedAt?: string | null;
}

export function AITab({ taskId, currentSmartScore, smartValidatedAt }: AITabProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  // Local state for immediate display of new validation result
  const [localValidation, setLocalValidation] = useState<{
    result: SMARTValidationResult;
    date: string;
  } | null>(null);

  // Queries
  const { data: conversations = [], isLoading: isLoadingConversations } = useTaskConversations(taskId);
  const { data: selectedConversation, isLoading: isLoadingConversation } = useConversationWithMessages(
    selectedConversationId || undefined
  );

  // Mutations
  const validateSMART = useValidateSMART();
  const startDialog = useStartDialog();
  const sendMessage = useSendMessage();

  // Handle SMART validation
  const handleValidateSMART = async () => {
    try {
      const result = await validateSMART.mutateAsync({ task_id: taskId });
      // Save validation result to local state for immediate display
      setLocalValidation({
        result: result.validation,
        date: new Date().toISOString(),
      });
      // Open the new conversation
      setSelectedConversationId(result.conversation_id);
    } catch (error) {
      console.error("SMART validation error:", error);
    }
  };

  // Handle dialog start
  const handleStartDialog = async (dialogType: DialogType) => {
    try {
      const result = await startDialog.mutateAsync({
        task_id: taskId,
        dialog_type: dialogType,
      });
      setSelectedConversationId(result.conversation_id);
    } catch (error) {
      console.error("Start dialog error:", error);
    }
  };

  // Handle send message in conversation
  const handleSendMessage = async () => {
    if (!selectedConversationId || !messageInput.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  // Get conversation type label
  const getConversationTypeLabel = (conversation: AIConversation) => {
    // First check context for dialog subtype
    const dialogType = conversation.context?.dialog_type as string | undefined;
    if (dialogType && CONVERSATION_TYPE_LABELS[dialogType]) {
      return CONVERSATION_TYPE_LABELS[dialogType];
    }
    return CONVERSATION_TYPE_LABELS[conversation.conversation_type] || conversation.conversation_type;
  };

  // Is conversation continuable?
  const isConversationContinuable = (conversation: AIConversation) => {
    return conversation.status === "active";
  };

  const isAnyMutationPending = validateSMART.isPending || startDialog.isPending;

  // Get the latest SMART validation from conversations (for real-time updates)
  const latestSmartValidation = useMemo(() => {
    const smartConversations = conversations.filter(
      (conv) => conv.conversation_type === "smart_validation" && conv.result
    );
    if (smartConversations.length === 0) return null;

    // Sort by created_at descending and get the first one
    const sorted = [...smartConversations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      result: sorted[0].result as unknown as SMARTValidationResult,
      date: sorted[0].created_at,
      conversationId: sorted[0].id,
    };
  }, [conversations]);

  // Use localValidation first (immediate), then latestSmartValidation, then props
  const displaySmartScore = localValidation?.result || latestSmartValidation?.result || currentSmartScore;
  const displaySmartDate = localValidation?.date || latestSmartValidation?.date || smartValidatedAt;

  return (
    <div className="p-4 space-y-6">
      {/* Action Buttons Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Действия</h3>
        <div className="flex flex-wrap gap-2">
          {/* SMART Validation Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateSMART}
            disabled={isAnyMutationPending}
            className="gap-2"
          >
            {validateSMART.isPending ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            )}
            SMART-анализ
          </Button>

          {/* SMART Wizard Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            disabled={isAnyMutationPending}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
            </svg>
            Мастер SMART
          </Button>

          {/* Dialog Dropdown */}
          <Dropdown
            align="left"
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyMutationPending}
                className="gap-2"
              >
                {startDialog.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                Диалог
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            }
          >
            {DIALOG_TYPES.map(({ value, label, description }) => (
              <DropdownItem
                key={value}
                onClick={() => handleStartDialog(value)}
              >
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Risk Analysis Button (placeholder for now) */}
          <Button
            variant="outline"
            size="sm"
            disabled={true}
            className="gap-2"
            title="В разработке"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Риски
          </Button>
        </div>
      </div>

      {/* Current SMART Score (if available) */}
      {displaySmartScore && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Текущий SMART-анализ</h3>
            {displaySmartDate && (
              <span className="text-xs text-gray-500">
                {formatDateTime(displaySmartDate)}
              </span>
            )}
          </div>
          <SMARTValidationCard
            validation={displaySmartScore}
            showApplyButton={false}
          />
        </div>
      )}

      {/* Conversation History */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          История общений ({conversations.length})
        </h3>

        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">Нет истории общений с AI</p>
            <p className="text-xs mt-1">Используйте кнопки выше для начала</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-colors
                  ${selectedConversationId === conv.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getConversationTypeLabel(conv)}
                    </span>
                    {isConversationContinuable(conv) && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        активен
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(conv.created_at)}
                  </span>
                </div>
                {conv.result && (conv.result as Record<string, number>).overall_score !== undefined && (
                  <div className="mt-1 text-xs text-gray-500">
                    Оценка: {Math.round((conv.result as Record<string, number>).overall_score * 100)}%
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Conversation View */}
      {selectedConversationId && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Просмотр диалога</h3>
            <button
              onClick={() => setSelectedConversationId(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoadingConversation ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : selectedConversation ? (
            <div className="space-y-4">
              {/* Messages */}
              <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-50 rounded-lg p-3">
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`
                      p-3 rounded-lg
                      ${msg.role === "user"
                        ? "bg-blue-100 ml-8"
                        : msg.role === "assistant"
                          ? "bg-white border border-gray-200 mr-8"
                          : "bg-gray-200 text-xs text-gray-600"
                      }
                    `}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {msg.role === "user" ? "Вы" : msg.role === "assistant" ? "AI" : "Система"}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
              </div>

              {/* Continue conversation input */}
              {isConversationContinuable(selectedConversation) && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Введите сообщение..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? <Spinner size="sm" /> : "Отправить"}
                  </Button>
                </div>
              )}

              {/* Completed conversation notice */}
              {!isConversationContinuable(selectedConversation) && (
                <div className="text-center py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                  Диалог завершён
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* SMART Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        size="lg"
      >
        <SMARTWizard
          taskId={taskId}
          onClose={() => setIsWizardOpen(false)}
        />
      </Modal>
    </div>
  );
}
