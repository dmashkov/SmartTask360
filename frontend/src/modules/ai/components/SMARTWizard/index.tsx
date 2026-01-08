/**
 * SmartTask360 — SMART Wizard Component
 *
 * Interactive wizard for refining tasks to SMART criteria:
 * 1. Analyze - AI analyzes task and generates questions
 * 2. Questions - User answers clarifying questions
 * 3. Proposal - AI generates SMART proposal
 * 4. Apply - User reviews and applies changes
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Button, Spinner } from "../../../../shared/ui";
import { useSmartAnalyze, useSmartRefine, useSmartApply } from "../../hooks";
import type {
  AIQuestion,
  AIAnswer,
  SMARTProposal,
  SMARTWizardStep,
  SMARTAnalyzeResponse,
  SMARTRefineResponse,
  SMARTValidationResult,
} from "../../types";
import { QuestionsStep } from "./QuestionsStep";
import { ProposalStep } from "./ProposalStep";

export interface SMARTWizardProps {
  taskId: string;
  currentSmartScore?: number | null; // Current overall score (0-1)
  onClose: () => void;
  onSuccess?: (newSmartScore?: SMARTValidationResult) => void;
}

export function SMARTWizard({ taskId, currentSmartScore, onClose, onSuccess }: SMARTWizardProps) {
  // State
  const [step, setStep] = useState<SMARTWizardStep>("idle");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialAssessment, setInitialAssessment] = useState<string>("");
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [proposal, setProposal] = useState<SMARTProposal | null>(null);
  const [originalTask, setOriginalTask] = useState<{ title: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent double initialization in StrictMode
  const isInitialized = useRef(false);

  // Mutations
  const analyzeMutation = useSmartAnalyze();
  const refineMutation = useSmartRefine();
  const applyMutation = useSmartApply();

  // Start analysis
  const handleStart = useCallback(async () => {
    setError(null);
    setStep("analyzing");

    try {
      const result: SMARTAnalyzeResponse = await analyzeMutation.mutateAsync({
        task_id: taskId,
        include_context: true,
      });

      setConversationId(result.conversation_id);
      setInitialAssessment(result.initial_assessment);
      setQuestions(result.questions);

      // Initialize answers with defaults
      const defaultAnswers: Record<string, string | string[]> = {};
      result.questions.forEach((q) => {
        if (q.default_value) {
          defaultAnswers[q.id] = q.default_value;
        } else if (q.type === "checkbox") {
          defaultAnswers[q.id] = [];
        } else {
          defaultAnswers[q.id] = "";
        }
      });
      setAnswers(defaultAnswers);

      setStep("questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка анализа");
      setStep("idle");
    }
  }, [taskId, analyzeMutation]);

  // Submit answers and get proposal
  const handleSubmitAnswers = useCallback(async () => {
    if (!conversationId) return;

    setError(null);
    setStep("refining");

    try {
      // Convert answers to array format
      const answersArray: AIAnswer[] = Object.entries(answers).map(([question_id, value]) => ({
        question_id,
        value,
      }));

      const result: SMARTRefineResponse = await refineMutation.mutateAsync({
        conversation_id: conversationId,
        answers: answersArray,
      });

      setProposal(result.proposal);
      setOriginalTask(result.original_task);
      setStep("proposal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка формирования предложения");
      setStep("questions");
    }
  }, [conversationId, answers, refineMutation]);

  // Apply proposal
  const handleApply = useCallback(
    async (
      applyTitle: boolean,
      applyDescription: boolean,
      applyDod: boolean,
      customTitle?: string,
      customDescription?: string,
      customDod?: string[]
    ) => {
      if (!conversationId) return;

      setError(null);
      setStep("applying");

      try {
        await applyMutation.mutateAsync({
          conversation_id: conversationId,
          apply_title: applyTitle,
          apply_description: applyDescription,
          apply_dod: applyDod,
          custom_title: customTitle,
          custom_description: customDescription,
          custom_dod: customDod,
        });

        setStep("done");
        // Pass the proposal's smart_scores to onSuccess for immediate UI update
        onSuccess?.(proposal?.smart_scores);

        // Close modal after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка применения");
        setStep("proposal");
      }
    },
    [conversationId, applyMutation, onSuccess, proposal]
  );

  // Reset and close
  const handleClose = useCallback(() => {
    setStep("idle");
    setConversationId(null);
    setInitialAssessment("");
    setQuestions([]);
    setAnswers({});
    setProposal(null);
    setOriginalTask(null);
    setError(null);
    onClose();
  }, [onClose]);

  // Update answer
  const handleAnswerChange = useCallback((questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  // Back to questions
  const handleBackToQuestions = useCallback(() => {
    setStep("questions");
  }, []);

  // Auto-start when mounted (with StrictMode protection)
  useEffect(() => {
    if (step === "idle" && !isInitialized.current) {
      isInitialized.current = true;
      handleStart();
    }
  }, []);

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">SMART-мастер</h2>
              <p className="text-sm text-gray-500">Помощник формулировки задачи</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <StepIndicator step={1} active={step === "analyzing" || step === "questions"} completed={step === "refining" || step === "proposal" || step === "applying" || step === "done"} label="Анализ" />
          <div className="flex-1 h-px bg-gray-200" />
          <StepIndicator step={2} active={step === "refining" || step === "proposal"} completed={step === "applying" || step === "done"} label="Предложение" />
          <div className="flex-1 h-px bg-gray-200" />
          <StepIndicator step={3} active={step === "applying" || step === "done"} completed={step === "done"} label="Применение" />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Content based on step */}
        {step === "idle" && (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-purple-200 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Сформулируйте задачу по SMART
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              AI проанализирует задачу, задаст уточняющие вопросы и предложит
              улучшенную формулировку с критериями выполнения.
            </p>
            <Button onClick={handleStart}>Начать анализ</Button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500">AI анализирует задачу...</p>
          </div>
        )}

        {step === "questions" && (
          <QuestionsStep
            initialAssessment={initialAssessment}
            questions={questions}
            answers={answers}
            currentSmartScore={currentSmartScore}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmitAnswers}
            onCancel={handleClose}
            isSubmitting={false}
          />
        )}

        {step === "refining" && (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500">Формируем предложение...</p>
          </div>
        )}

        {step === "proposal" && proposal && originalTask && (
          <ProposalStep
            proposal={proposal}
            originalTask={originalTask}
            currentSmartScore={currentSmartScore}
            onApply={handleApply}
            onBack={handleBackToQuestions}
            onCancel={handleClose}
            isApplying={false}
          />
        )}

        {step === "applying" && (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-500">Применяем изменения...</p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Готово!</h3>
            <p className="text-gray-500">Задача обновлена по SMART-критериям</p>
          </div>
        )}
    </div>
  );
}

// Step indicator component
function StepIndicator({
  step,
  active,
  completed,
  label,
}: {
  step: number;
  active: boolean;
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completed
            ? "bg-purple-600 text-white"
            : active
            ? "bg-purple-100 text-purple-600 border-2 border-purple-600"
            : "bg-gray-100 text-gray-400"
        }`}
      >
        {completed ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          step
        )}
      </div>
      <span className={`text-sm ${active || completed ? "text-gray-900 font-medium" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}
