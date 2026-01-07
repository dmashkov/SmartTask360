/**
 * SmartTask360 — SMART Validation Card Component
 *
 * Displays SMART validation results with:
 * - S-M-A-R-T score indicators
 * - Overall score and status
 * - Recommendations list
 * - Acceptance criteria (DoD)
 */

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "../../../shared/ui";
import type { SMARTValidationResult, SMARTCriterion, AcceptanceCriterion } from "../types";

interface SMARTValidationCardProps {
  validation: SMARTValidationResult;
  onApplySuggestions?: () => void;
  onApplyAcceptanceCriteria?: (criteria: AcceptanceCriterion[]) => void;
  isApplying?: boolean;
  showApplyButton?: boolean;
}

// Score color based on value
function getScoreColor(score: number): string {
  if (score >= 0.8) return "bg-green-500";
  if (score >= 0.6) return "bg-yellow-500";
  if (score >= 0.4) return "bg-orange-500";
  return "bg-red-500";
}

// Score text color
function getScoreTextColor(score: number): string {
  if (score >= 0.8) return "text-green-600";
  if (score >= 0.6) return "text-yellow-600";
  if (score >= 0.4) return "text-orange-600";
  return "text-red-600";
}

// SMART letter component
function SMARTLetter({
  letter,
  criterion,
  isExpanded,
  onToggle,
}: {
  letter: string;
  criterion: SMARTCriterion;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scorePercent = Math.round(criterion.score * 100);

  return (
    <div className="flex flex-col">
      {/* Letter with score ring */}
      <button
        onClick={onToggle}
        className="relative flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
        title={`${criterion.name}: ${scorePercent}%`}
      >
        {/* Circular progress */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              strokeWidth="4"
              fill="none"
              className="stroke-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              className={getScoreColor(criterion.score).replace("bg-", "stroke-")}
              strokeDasharray={`${scorePercent * 1.256} 125.6`}
            />
          </svg>
          {/* Letter in center */}
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
            {letter}
          </span>
        </div>
        {/* Score below */}
        <span className={`text-xs font-medium mt-1 ${getScoreTextColor(criterion.score)}`}>
          {scorePercent}%
        </span>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm max-w-[200px]">
          <p className="font-medium text-gray-700 mb-1">{criterion.name}</p>
          <p className="text-gray-600 text-xs mb-2">{criterion.explanation}</p>
          {criterion.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Рекомендации:</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {criterion.suggestions.slice(0, 2).map((s, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-blue-500 shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SMARTValidationCard({
  validation,
  onApplySuggestions,
  onApplyAcceptanceCriteria,
  isApplying = false,
  showApplyButton = true,
}: SMARTValidationCardProps) {
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);
  const [showAcceptanceCriteria, setShowAcceptanceCriteria] = useState(false);

  const overallPercent = Math.round(validation.overall_score * 100);

  // Map criteria to letters
  const criteriaMap: Record<string, SMARTCriterion | undefined> = {};
  validation.criteria.forEach((c) => {
    const letter = c.name.charAt(0).toUpperCase();
    criteriaMap[letter] = c;
  });

  const letters = ["S", "M", "A", "R", "T"];

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">SMART-анализ</CardTitle>
            {/* Overall score badge */}
            <span
              className={`px-2 py-0.5 rounded text-sm font-medium ${
                validation.is_valid
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {overallPercent}%
            </span>
          </div>
          {/* Status indicator */}
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              validation.is_valid
                ? "bg-green-100 text-green-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {validation.is_valid ? "✓ Соответствует SMART" : "⚠ Требует доработки"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SMART Letters Row */}
        <div className="flex justify-center gap-2">
          {letters.map((letter) => {
            const criterion = criteriaMap[letter];
            if (!criterion) return null;
            return (
              <SMARTLetter
                key={letter}
                letter={letter}
                criterion={criterion}
                isExpanded={expandedLetter === letter}
                onToggle={() =>
                  setExpandedLetter(expandedLetter === letter ? null : letter)
                }
              />
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">{validation.summary}</p>
        </div>

        {/* Recommendations */}
        {validation.recommended_changes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Рекомендации по улучшению
            </h4>
            <ul className="space-y-1">
              {validation.recommended_changes.map((change, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span className="text-blue-500 shrink-0 mt-0.5">→</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
            {showApplyButton && onApplySuggestions && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={onApplySuggestions}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Применение...
                  </>
                ) : (
                  "Применить рекомендации к описанию"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Acceptance Criteria (DoD) */}
        {validation.acceptance_criteria && validation.acceptance_criteria.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => setShowAcceptanceCriteria(!showAcceptanceCriteria)}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="text-sm font-medium text-gray-700">
                Критерии готовности (DoD)
              </h4>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showAcceptanceCriteria ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showAcceptanceCriteria && (
              <div className="mt-3 space-y-2">
                {validation.acceptance_criteria.map((criterion, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-green-500 shrink-0">☐</span>
                      <div>
                        <p className="text-sm text-gray-700">
                          {criterion.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Проверка:</span>{" "}
                          {criterion.verification}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {onApplyAcceptanceCriteria && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() =>
                      onApplyAcceptanceCriteria(validation.acceptance_criteria)
                    }
                  >
                    Добавить в чек-лист задачи
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
