/**
 * SmartTask360 — Questions Step Component
 *
 * Renders AI-generated clarifying questions with different input types:
 * - radio: Single choice
 * - checkbox: Multiple choice
 * - text: Free-form input
 */

import { Button } from "../../../../shared/ui";
import type { AIQuestion } from "../../types";

interface QuestionsStepProps {
  initialAssessment: string;
  questions: AIQuestion[];
  answers: Record<string, string | string[]>;
  currentSmartScore?: number | null; // Current overall score (0-1)
  onAnswerChange: (questionId: string, value: string | string[]) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function QuestionsStep({
  initialAssessment,
  questions,
  answers,
  currentSmartScore,
  onAnswerChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: QuestionsStepProps) {
  // Check if all required questions are answered
  const isValid = questions.every((q) => {
    if (!q.required) return true;
    const answer = answers[q.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer && answer.trim() !== "";
  });

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Current SMART score badge */}
      {currentSmartScore != null && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">Текущая SMART-оценка:</span>
          <span className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(currentSmartScore)}`}>
            {Math.round(currentSmartScore * 100)}%
          </span>
          <span className="text-xs text-gray-400">→ улучшим с помощью мастера</span>
        </div>
      )}

      {/* Initial assessment */}
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">AI-помощник</p>
            <p className="text-sm text-purple-700">{initialAssessment}</p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {questions.map((question, index) => (
          <QuestionField
            key={question.id}
            question={question}
            index={index + 1}
            value={answers[question.id]}
            onChange={(value) => onAnswerChange(question.id, value)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button onClick={onSubmit} disabled={!isValid || isSubmitting} isLoading={isSubmitting}>
          Сформировать предложение
        </Button>
      </div>
    </div>
  );
}

// Individual question field
function QuestionField({
  question,
  index,
  value,
  onChange,
}: {
  question: AIQuestion;
  index: number;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  const handleRadioChange = (optionValue: string) => {
    onChange(optionValue);
  };

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const currentValue = Array.isArray(value) ? value : [];
    if (checked) {
      onChange([...currentValue, optionValue]);
    } else {
      onChange(currentValue.filter((v) => v !== optionValue));
    }
  };

  const handleTextChange = (text: string) => {
    onChange(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-gray-500">{index}.</span>
        <span className="text-sm font-medium text-gray-900">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>

      {question.type === "radio" && question.options && (
        <div className="ml-5 space-y-2">
          {question.options.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                value === option.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={value === option.value}
                onChange={() => handleRadioChange(option.value)}
                className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{option.label}</span>
                {option.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                )}
              </div>
            </label>
          ))}
          {/* Other option with text input */}
          {value && !question.options.some((o) => o.value === value) && (
            <div className="mt-2">
              <input
                type="text"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Укажите свой вариант..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      )}

      {question.type === "checkbox" && question.options && (
        <div className="ml-5 space-y-2">
          {question.options.map((option) => {
            const isChecked = Array.isArray(value) && value.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isChecked
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={isChecked}
                  onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                  {option.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <div className="ml-5">
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Введите ответ..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
      )}
    </div>
  );
}
