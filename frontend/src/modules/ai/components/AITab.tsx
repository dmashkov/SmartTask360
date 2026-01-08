/**
 * SmartTask360 — AI Tab Component
 *
 * Main AI tab for task detail page with:
 * - Action buttons (SMART, Dialog dropdown, Risks)
 * - Conversation history list
 * - Conversation viewer/continuation modal
 */

import { useState, useMemo } from "react";
import { Button, Dropdown, DropdownItem, Spinner, Modal, ResizableModal } from "../../../shared/ui";
import { formatDateTime } from "../../../shared/lib/utils";
import {
  useValidateSMART,
  useTaskConversations,
  useStartDialog,
  useConversationWithMessages,
  useSendMessage,
  useAnalyzeRisks,
  useReviewProgress,
  useAutoComment,
} from "../hooks";
import type {
  AIConversation,
  DialogType,
  SMARTValidationResult,
  RiskAnalysisResult,
  ProgressReviewResult,
  AICommentType,
} from "../types";
import { SMARTValidationCard } from "./SMARTValidationCard";
import { SMARTWizard } from "./SMARTWizard";
import { ConversationViewer } from "./ConversationViewer";
import { AIChat } from "./AIChat";

// Dialog type labels
const DIALOG_TYPES: { value: DialogType; label: string; description: string }[] = [
  { value: "clarify", label: "Уточнить", description: "Уточнить требования и детали" },
  { value: "decompose", label: "Декомпозировать", description: "Разбить на подзадачи с оценкой" },
  { value: "technical", label: "Техническое решение", description: "Обсудить архитектуру и подход" },
  { value: "testing", label: "Тестирование", description: "Сгенерировать тест-кейсы" },
];

// Conversation type labels
const CONVERSATION_TYPE_LABELS: Record<string, string> = {
  smart_validation: "SMART-анализ",
  task_dialog: "Диалог",
  risk_analysis: "Анализ рисков",
  clarify: "Уточнение",
  decompose: "Декомпозиция",
  technical: "Техническое решение",
  testing: "Тестирование",
  ai_comment: "AI-комментарий",
  progress_review: "Обзор прогресса",
};

// AI Comment types (без risk и progress - они есть как отдельные кнопки)
const AI_COMMENT_TYPES: { value: AICommentType; label: string; icon: string; description: string }[] = [
  { value: "insight", label: "Инсайт", icon: "💡", description: "Аналитическое наблюдение" },
  { value: "blocker", label: "Блокер", icon: "🚫", description: "Проблема-блокер" },
  { value: "suggestion", label: "Предложение", icon: "✨", description: "Рекомендация по улучшению" },
];

interface AITabProps {
  taskId: string;
  currentSmartScore?: SMARTValidationResult | null;
  smartValidatedAt?: string | null;
}

export function AITab({ taskId, currentSmartScore, smartValidatedAt }: AITabProps) {
  // For active dialog modal
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  // For accordion in history
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeChatDialog, setActiveChatDialog] = useState<DialogType | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  // Local state for immediate display of new validation result
  const [localValidation, setLocalValidation] = useState<{
    result: SMARTValidationResult;
    date: string;
  } | null>(null);

  // Local state for risk analysis result
  const [localRiskAnalysis, setLocalRiskAnalysis] = useState<{
    result: RiskAnalysisResult;
    date: string;
  } | null>(null);

  // Local state for progress review result
  const [localProgressReview, setLocalProgressReview] = useState<{
    result: ProgressReviewResult;
    date: string;
  } | null>(null);

  // Queries
  const { data: conversations = [], isLoading: isLoadingConversations } = useTaskConversations(taskId);
  // For modal dialog
  const { data: selectedConversation, isLoading: isLoadingConversation } = useConversationWithMessages(
    selectedConversationId || undefined
  );
  // For expanded accordion item
  const { data: expandedConversation, isLoading: isLoadingExpanded } = useConversationWithMessages(
    expandedConversationId || undefined
  );

  // Mutations
  const validateSMART = useValidateSMART();
  const startDialog = useStartDialog();
  const sendMessage = useSendMessage();
  const analyzeRisks = useAnalyzeRisks();
  const reviewProgress = useReviewProgress();
  const autoComment = useAutoComment();

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
    // Open modal immediately to show loading state
    setActiveChatDialog(dialogType);
    setDialogError(null);

    try {
      const result = await startDialog.mutateAsync({
        task_id: taskId,
        dialog_type: dialogType,
      });
      setSelectedConversationId(result.conversation_id);
    } catch (error: unknown) {
      console.error("Start dialog error:", error);
      // Show error in modal instead of closing
      const message = error instanceof Error ? error.message : "Ошибка запуска диалога";
      setDialogError(message);
    }
  };

  // Handle risk analysis
  const handleAnalyzeRisks = async () => {
    try {
      const result = await analyzeRisks.mutateAsync({ task_id: taskId });
      setLocalRiskAnalysis({
        result: result.analysis,
        date: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Risk analysis error:", error);
    }
  };

  // Handle progress review
  const handleReviewProgress = async () => {
    try {
      const result = await reviewProgress.mutateAsync({ task_id: taskId, include_subtasks: true });
      setLocalProgressReview({
        result: result.review,
        date: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Progress review error:", error);
    }
  };

  // Handle AI comment generation
  const handleGenerateComment = async (commentType: AICommentType) => {
    try {
      await autoComment.mutateAsync({ taskId, commentType });
      // Comment is automatically added to task, no need to show result here
    } catch (error) {
      console.error("AI comment error:", error);
    }
  };

  // Handle send message in modal conversation
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

  // Handle send message in expanded accordion conversation
  const handleSendExpandedMessage = async () => {
    if (!expandedConversationId || !messageInput.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: expandedConversationId,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  // Toggle accordion item
  const toggleConversation = (convId: string) => {
    setExpandedConversationId(expandedConversationId === convId ? null : convId);
    setMessageInput(""); // Clear input when switching
  };

  // Get conversation type label
  const getConversationTypeLabel = (conversation: AIConversation) => {
    // For AI comments, show the comment type
    if (conversation.conversation_type === "ai_comment") {
      const commentType = conversation.context?.comment_type as string | undefined;
      const commentTypeLabels: Record<string, string> = {
        insight: "💡 Инсайт",
        risk: "⚠️ Риск",
        progress: "📈 Прогресс",
        blocker: "🚫 Блокер",
        suggestion: "✨ Предложение",
      };
      if (commentType && commentTypeLabels[commentType]) {
        return commentTypeLabels[commentType];
      }
      return "AI-комментарий";
    }

    // For dialogs, check context for subtype
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

  const isAnyMutationPending = validateSMART.isPending || startDialog.isPending || analyzeRisks.isPending || reviewProgress.isPending || autoComment.isPending;

  // Get the latest SMART score from conversations (both smart_validation and smart_wizard)
  const latestSmartValidation = useMemo(() => {
    // Get all conversations that have SMART scores
    const smartConversations = conversations.filter((conv) => {
      if (conv.conversation_type === "smart_validation" && conv.result) {
        return true;
      }
      if (conv.conversation_type === "smart_wizard" && conv.result) {
        // Wizard stores scores in result.proposal.smart_scores
        const wizardResult = conv.result as { proposal?: { smart_scores?: unknown } };
        return !!wizardResult?.proposal?.smart_scores;
      }
      return false;
    });

    if (smartConversations.length === 0) return null;

    // Sort by created_at descending and get the most recent
    const sorted = [...smartConversations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const latest = sorted[0];

    // Extract SMART result based on conversation type
    let smartResult: SMARTValidationResult;
    if (latest.conversation_type === "smart_wizard") {
      const wizardResult = latest.result as { proposal?: { smart_scores?: SMARTValidationResult } };
      smartResult = wizardResult.proposal!.smart_scores!;
    } else {
      smartResult = latest.result as unknown as SMARTValidationResult;
    }

    return {
      result: smartResult,
      date: latest.created_at,
      conversationId: latest.id,
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

          {/* Risk Analysis Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeRisks}
            disabled={isAnyMutationPending}
            className="gap-2"
          >
            {analyzeRisks.isPending ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            Риски
          </Button>

          {/* Progress Review Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReviewProgress}
            disabled={isAnyMutationPending}
            className="gap-2"
          >
            {reviewProgress.isPending ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
            Прогресс
          </Button>

          {/* AI Comment Dropdown */}
          <Dropdown
            align="left"
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyMutationPending}
                className="gap-2"
              >
                {autoComment.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                )}
                AI-коммент
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            }
          >
            {AI_COMMENT_TYPES.map(({ value, label, icon, description }) => (
              <DropdownItem
                key={value}
                onClick={() => handleGenerateComment(value)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-gray-500">{description}</div>
                  </div>
                </div>
              </DropdownItem>
            ))}
          </Dropdown>
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

      {/* Risk Analysis Result */}
      {localRiskAnalysis && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Анализ рисков</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatDateTime(localRiskAnalysis.date)}
              </span>
              <button
                onClick={() => setLocalRiskAnalysis(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <RiskAnalysisCard analysis={localRiskAnalysis.result} />
        </div>
      )}

      {/* Progress Review Result */}
      {localProgressReview && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Обзор прогресса</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {formatDateTime(localProgressReview.date)}
              </span>
              <button
                onClick={() => setLocalProgressReview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <ProgressReviewCard review={localProgressReview.result} />
        </div>
      )}

      {/* Conversation History - Accordion */}
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
            {conversations.map((conv) => {
              const isExpanded = expandedConversationId === conv.id;
              const isContinuable = isConversationContinuable(conv);

              return (
                <div
                  key={conv.id}
                  className={`
                    rounded-lg border transition-all
                    ${isExpanded
                      ? "border-blue-500 bg-blue-50/30"
                      : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleConversation(conv.id)}
                    className="w-full text-left p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {/* Expand/Collapse icon */}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium">
                        {getConversationTypeLabel(conv)}
                      </span>
                      {isContinuable && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
                          активен
                        </span>
                      )}
                      {conv.result && (conv.result as Record<string, number>).overall_score !== undefined && (
                        <span className="text-xs text-gray-500">
                          ({Math.round((conv.result as Record<string, number>).overall_score * 100)}%)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(conv.created_at)}
                    </span>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg">
                      {isLoadingExpanded ? (
                        <div className="flex items-center justify-center py-6">
                          <Spinner size="md" />
                        </div>
                      ) : expandedConversation ? (
                        <div className="space-y-3">
                          {/* Conversation messages */}
                          <div className="max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-3">
                            <ConversationViewer conversation={expandedConversation} />
                          </div>

                          {/* Continue conversation input */}
                          {isContinuable && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendExpandedMessage();
                                  }
                                }}
                                placeholder="Введите сообщение..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={sendMessage.isPending}
                              />
                              <Button
                                size="sm"
                                onClick={handleSendExpandedMessage}
                                disabled={!messageInput.trim() || sendMessage.isPending}
                              >
                                {sendMessage.isPending ? <Spinner size="sm" /> : "Отправить"}
                              </Button>
                            </div>
                          )}

                          {/* Completed notice */}
                          {!isContinuable && (
                            <div className="text-center py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                              Диалог завершён
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SMART Wizard Modal */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        size="lg"
      >
        <SMARTWizard
          taskId={taskId}
          currentSmartScore={displaySmartScore?.overall_score}
          onClose={() => setIsWizardOpen(false)}
          onSuccess={(newSmartScore) => {
            // Update local state with new SMART score from wizard
            if (newSmartScore) {
              setLocalValidation({
                result: newSmartScore,
                date: new Date().toISOString(),
              });
            }
          }}
        />
      </Modal>

      {/* AI Chat Modal for active dialogs */}
      <ResizableModal
        isOpen={activeChatDialog !== null}
        onClose={() => {
          setActiveChatDialog(null);
          setSelectedConversationId(null);
          setDialogError(null);
        }}
        initialWidth={700}
        initialHeight={600}
        minWidth={400}
        minHeight={350}
        maxWidth={1200}
        maxHeight={900}
        storageKey="ai-chat-dialog"
      >
        {activeChatDialog && (
          <div className="h-full">
            {dialogError ? (
              // Error state
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❌</span>
                    <div>
                      <h3 className="font-medium text-gray-900">Ошибка диалога</h3>
                      <p className="text-xs text-gray-500">Не удалось запустить AI диалог</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveChatDialog(null);
                      setDialogError(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="text-red-500 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-2">{dialogError}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Проверьте, что backend запущен и AI API ключ настроен
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => handleStartDialog(activeChatDialog)}
                    >
                      Попробовать снова
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Normal chat
              <AIChat
                dialogType={activeChatDialog}
                messages={selectedConversation?.messages || []}
                isLoading={startDialog.isPending || isLoadingConversation || !selectedConversation}
                isSending={sendMessage.isPending}
                onSendMessage={(content) => {
                  if (selectedConversationId) {
                    sendMessage.mutate({
                      conversationId: selectedConversationId,
                      content,
                    });
                  }
                }}
                onClose={() => {
                  setActiveChatDialog(null);
                  setSelectedConversationId(null);
                  setDialogError(null);
                }}
              />
            )}
          </div>
        )}
      </ResizableModal>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

// Risk level badge colors
const RISK_LEVEL_COLORS = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const RISK_LEVEL_LABELS = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const RISK_CATEGORY_LABELS = {
  technical: "Технический",
  resource: "Ресурсы",
  schedule: "Сроки",
  quality: "Качество",
};

const RISK_CATEGORY_ICONS = {
  technical: "⚙️",
  resource: "👥",
  schedule: "⏰",
  quality: "✓",
};

// Risk Analysis Card Component
function RiskAnalysisCard({ analysis }: { analysis: RiskAnalysisResult }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Overall Risk Level */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Общий уровень риска</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${RISK_LEVEL_COLORS[analysis.overall_risk_level]}`}>
          {RISK_LEVEL_LABELS[analysis.overall_risk_level]}
        </span>
      </div>

      {/* Risks List */}
      {analysis.risks.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Выявленные риски</span>
          <div className="space-y-2">
            {analysis.risks.map((risk, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{RISK_CATEGORY_ICONS[risk.category]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">
                        {RISK_CATEGORY_LABELS[risk.category]}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${RISK_LEVEL_COLORS[risk.severity]}`}>
                        {RISK_LEVEL_LABELS[risk.severity]}
                      </span>
                      <span className="text-xs text-gray-400">
                        P: {RISK_LEVEL_LABELS[risk.probability]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{risk.description}</p>
                    {risk.mitigation && (
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Митигация:</span> {risk.mitigation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Рекомендации</span>
          <ul className="space-y-1">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Progress status colors
const PROGRESS_STATUS_COLORS = {
  on_track: "bg-green-100 text-green-800",
  at_risk: "bg-yellow-100 text-yellow-800",
  blocked: "bg-red-100 text-red-800",
};

const PROGRESS_STATUS_LABELS = {
  on_track: "В графике",
  at_risk: "Под угрозой",
  blocked: "Заблокировано",
};

// Progress Review Card Component
function ProgressReviewCard({ review }: { review: ProgressReviewResult }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Status and Risk Level */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${PROGRESS_STATUS_COLORS[review.progress_status]}`}>
            {PROGRESS_STATUS_LABELS[review.progress_status]}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${RISK_LEVEL_COLORS[review.risk_level]}`}>
            Риск: {RISK_LEVEL_LABELS[review.risk_level]}
          </span>
        </div>
        {review.completion_estimate && (
          <span className="text-sm text-gray-600">
            Завершение: {review.completion_estimate}
          </span>
        )}
      </div>

      {/* Summary */}
      <div>
        <p className="text-sm text-gray-700">{review.summary}</p>
      </div>

      {/* Going Well */}
      {review.going_well.length > 0 && (
        <div className="space-y-1">
          <span className="text-sm font-medium text-green-700">Что идёт хорошо</span>
          <ul className="space-y-1">
            {review.going_well.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concerns */}
      {review.concerns.length > 0 && (
        <div className="space-y-1">
          <span className="text-sm font-medium text-yellow-700">Опасения</span>
          <ul className="space-y-1">
            {review.concerns.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-yellow-500">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {review.next_steps.length > 0 && (
        <div className="space-y-1">
          <span className="text-sm font-medium text-blue-700">Следующие шаги</span>
          <ul className="space-y-1">
            {review.next_steps.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
