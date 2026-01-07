/**
 * SmartTask360 — SMART Validation Button Component
 *
 * Button that triggers SMART validation and displays results in a modal.
 */

import { useState } from "react";
import { Button, Modal, Spinner } from "../../../shared/ui";
import { useValidateSMART, useApplySMARTSuggestions } from "../hooks";
import { SMARTValidationCard } from "./SMARTValidationCard";
import type { SMARTValidationResult, AcceptanceCriterion } from "../types";

interface SMARTValidationButtonProps {
  taskId: string;
  disabled?: boolean;
  onValidationComplete?: (result: SMARTValidationResult) => void;
  onApplyAcceptanceCriteria?: (criteria: AcceptanceCriterion[]) => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function SMARTValidationButton({
  taskId,
  disabled = false,
  onValidationComplete,
  onApplyAcceptanceCriteria,
  className,
  variant = "outline",
  size = "sm",
}: SMARTValidationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<SMARTValidationResult | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const validateMutation = useValidateSMART();
  const applySuggestionsMutation = useApplySMARTSuggestions();

  const handleValidate = async () => {
    try {
      const response = await validateMutation.mutateAsync({
        task_id: taskId,
        include_context: true,
      });

      setValidationResult(response.validation);
      setConversationId(response.conversation_id);
      setIsModalOpen(true);

      onValidationComplete?.(response.validation);
    } catch (error) {
      console.error("SMART validation failed:", error);
    }
  };

  const handleApplySuggestions = async () => {
    if (!conversationId) return;

    try {
      await applySuggestionsMutation.mutateAsync({
        taskId,
        conversationId,
      });
      // Could show success toast here
    } catch (error) {
      console.error("Failed to apply suggestions:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Keep the result for potential re-open
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleValidate}
        disabled={disabled || validateMutation.isPending}
        className={className}
      >
        {validateMutation.isPending ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Проверка...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
            Проверить на SMART
          </>
        )}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="lg"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Результат SMART-анализа
          </h2>
          {validationResult ? (
            <SMARTValidationCard
              validation={validationResult}
              onApplySuggestions={handleApplySuggestions}
              onApplyAcceptanceCriteria={onApplyAcceptanceCriteria}
              isApplying={applySuggestionsMutation.isPending}
              showApplyButton={true}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
