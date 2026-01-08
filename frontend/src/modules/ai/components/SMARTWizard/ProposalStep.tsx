/**
 * SmartTask360 — Proposal Step Component
 *
 * Displays the AI-generated SMART proposal with:
 * - Proposed title and description (editable)
 * - Definition of Done items (editable)
 * - Time estimate
 * - SMART scores
 */

import { useState, useMemo } from "react";
import { Button } from "../../../../shared/ui";
import type { SMARTProposal } from "../../types";
import { SMARTValidationCard } from "../SMARTValidationCard";

/**
 * Normalize DoD items to strings (handle objects if AI returned wrong format)
 */
function normalizeDoDItems(items: unknown[]): string[] {
  return items
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        // Try to extract meaningful text from object
        if (typeof obj.description === "string" && obj.description) {
          return obj.description;
        }
        if (typeof obj.content === "string" && obj.content) {
          return obj.content;
        }
        if (typeof obj.verification === "string" && obj.verification) {
          return obj.verification;
        }
        // Fallback: first string value
        for (const v of Object.values(obj)) {
          if (typeof v === "string" && v.trim()) {
            return v;
          }
        }
      }
      return String(item);
    })
    .filter((item) => item && item.trim());
}

interface ProposalStepProps {
  proposal: SMARTProposal;
  originalTask: { title: string; description: string };
  currentSmartScore?: number | null; // Current overall score (0-1) for before/after comparison
  onApply: (
    applyTitle: boolean,
    applyDescription: boolean,
    applyDod: boolean,
    customTitle?: string,
    customDescription?: string,
    customDod?: string[]
  ) => void;
  onBack: () => void;
  onCancel: () => void;
  isApplying: boolean;
}

export function ProposalStep({
  proposal,
  originalTask,
  currentSmartScore,
  onApply,
  onBack,
  onCancel,
  isApplying,
}: ProposalStepProps) {
  // Normalize DoD items once (handles case where AI returned objects instead of strings)
  const normalizedDod = useMemo(
    () => normalizeDoDItems(proposal.definition_of_done as unknown[]),
    [proposal.definition_of_done]
  );

  // Editable state
  const [title, setTitle] = useState(proposal.title);
  const [description, setDescription] = useState(proposal.description);
  const [dodItems, setDodItems] = useState<string[]>(normalizedDod);

  // Apply options
  const [applyTitle, setApplyTitle] = useState(true);
  const [applyDescription, setApplyDescription] = useState(true);
  const [applyDod, setApplyDod] = useState(true);

  // Editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingDodIndex, setEditingDodIndex] = useState<number | null>(null);
  const [newDodItem, setNewDodItem] = useState("");

  const handleApply = () => {
    onApply(
      applyTitle,
      applyDescription,
      applyDod,
      title !== proposal.title ? title : undefined,
      description !== proposal.description ? description : undefined,
      // Always send dodItems to ensure backend receives properly normalized strings
      dodItems
    );
  };

  const handleAddDodItem = () => {
    if (newDodItem.trim()) {
      setDodItems([...dodItems, newDodItem.trim()]);
      setNewDodItem("");
    }
  };

  const handleRemoveDodItem = (index: number) => {
    setDodItems(dodItems.filter((_, i) => i !== index));
  };

  const handleUpdateDodItem = (index: number, value: string) => {
    const updated = [...dodItems];
    updated[index] = value;
    setDodItems(updated);
    setEditingDodIndex(null);
  };

  // Get new score from proposal
  const newScore = proposal.smart_scores?.overall_score;

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Calculate improvement
  const improvement = currentSmartScore != null && newScore != null
    ? Math.round((newScore - currentSmartScore) * 100)
    : null;

  return (
    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
      {/* Score comparison: Before → After */}
      {(currentSmartScore != null || newScore != null) && (
        <div className="p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-4">
            {/* Before */}
            {currentSmartScore != null && (
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Было</div>
                <span className={`text-xl font-bold px-3 py-1 rounded-full ${getScoreColor(currentSmartScore)}`}>
                  {Math.round(currentSmartScore * 100)}%
                </span>
              </div>
            )}

            {/* Arrow */}
            {currentSmartScore != null && newScore != null && (
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                {improvement != null && improvement > 0 && (
                  <span className="text-sm font-bold text-green-600">+{improvement}%</span>
                )}
              </div>
            )}

            {/* After */}
            {newScore != null && (
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Станет</div>
                <span className={`text-xl font-bold px-3 py-1 rounded-full ${getScoreColor(newScore)}`}>
                  {Math.round(newScore * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={applyTitle}
              onChange={(e) => setApplyTitle(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Название</span>
          </label>
          {!isEditingTitle && (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              Редактировать
            </button>
          )}
        </div>
        {isEditingTitle ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setTitle(proposal.title);
                  setIsEditingTitle(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Сбросить
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Готово
              </button>
            </div>
          </div>
        ) : (
          <div className={`p-3 rounded-lg border ${applyTitle ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {title !== originalTask.title && (
              <p className="text-xs text-gray-500 mt-1 line-through">{originalTask.title}</p>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={applyDescription}
              onChange={(e) => setApplyDescription(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">Описание</span>
          </label>
          {!isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              Редактировать
            </button>
          )}
        </div>
        {isEditingDescription ? (
          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDescription(proposal.description);
                  setIsEditingDescription(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Сбросить
              </button>
              <button
                onClick={() => setIsEditingDescription(false)}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                Готово
              </button>
            </div>
          </div>
        ) : (
          <div className={`p-3 rounded-lg border max-h-48 overflow-y-auto ${applyDescription ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{description}</div>
          </div>
        )}
      </div>

      {/* Definition of Done */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={applyDod}
              onChange={(e) => setApplyDod(e.target.checked)}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Критерии выполнения (DoD)
            </span>
          </label>
          <span className="text-xs text-gray-500">{dodItems.length} пунктов</span>
        </div>
        <div className={`p-3 rounded-lg border ${applyDod ? "border-purple-200 bg-purple-50" : "border-gray-200 bg-gray-50"}`}>
          <ul className="space-y-2">
            {dodItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 group">
                <span className="text-purple-500 mt-0.5">□</span>
                {editingDodIndex === index ? (
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...dodItems];
                      updated[index] = e.target.value;
                      setDodItems(updated);
                    }}
                    onBlur={() => setEditingDodIndex(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateDodItem(index, item);
                      }
                    }}
                    autoFocus
                    className="flex-1 px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                ) : (
                  <span
                    className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-purple-600"
                    onClick={() => setEditingDodIndex(index)}
                  >
                    {item}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveDodItem(index)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          {/* Add new item */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newDodItem}
              onChange={(e) => setNewDodItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddDodItem();
                }
              }}
              placeholder="Добавить критерий..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={handleAddDodItem}
              disabled={!newDodItem.trim()}
              className="text-purple-600 hover:text-purple-700 disabled:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Time Estimate */}
      {proposal.time_estimate && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Оценка времени</span>
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <span className="text-2xl font-bold text-gray-900">{proposal.time_estimate.total_hours}</span>
                <span className="text-sm text-gray-500 ml-1">часов</span>
              </div>
              <div className="text-gray-300">|</div>
              <div>
                <span className="text-2xl font-bold text-gray-900">{proposal.time_estimate.total_days}</span>
                <span className="text-sm text-gray-500 ml-1">дней</span>
              </div>
              <div className="ml-auto">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    proposal.time_estimate.confidence === "high"
                      ? "bg-green-100 text-green-700"
                      : proposal.time_estimate.confidence === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {proposal.time_estimate.confidence === "high"
                    ? "Высокая точность"
                    : proposal.time_estimate.confidence === "medium"
                    ? "Средняя точность"
                    : "Низкая точность"}
                </span>
              </div>
            </div>
            {proposal.time_estimate.breakdown.length > 0 && (
              <div className="space-y-1 text-sm">
                {proposal.time_estimate.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-gray-600">
                    <span>{item.task}</span>
                    <span className="font-medium">{item.hours}ч</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMART Scores */}
      {proposal.smart_scores && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">SMART-оценка предложения</span>
          <SMARTValidationCard validation={proposal.smart_scores} showApplyButton={false} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
        <Button variant="ghost" onClick={onBack}>
          ← Назад
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            onClick={handleApply}
            disabled={(!applyTitle && !applyDescription && !applyDod) || isApplying}
            isLoading={isApplying}
          >
            Применить
          </Button>
        </div>
      </div>
    </div>
  );
}
