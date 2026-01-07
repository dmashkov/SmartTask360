/**
 * SmartTask360 — Settings Page
 */

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "../shared/ui";
import { useAuth } from "../modules/auth";
import {
  useAISettings,
  useUpdateAISettings,
  useAIPrompts,
  useUpdateAIPrompt,
  useResetAIPrompt,
} from "../modules/settings";
import type {
  AIModel,
  AIModelInfo,
  AIModelTier,
  AILanguage,
  PromptType,
  AIPromptResponse,
} from "../modules/settings";

// Tier badge colors
const tierColors: Record<AIModelTier, string> = {
  recommended: "bg-green-100 text-green-700 border-green-200",
  premium: "bg-purple-100 text-purple-700 border-purple-200",
  standard: "bg-blue-100 text-blue-700 border-blue-200",
  economy: "bg-gray-100 text-gray-700 border-gray-200",
};

// Tier labels
const tierLabels: Record<AIModelTier, string> = {
  recommended: "Рекомендуется",
  premium: "Премиум",
  standard: "Стандарт",
  economy: "Эконом",
};

// Prompt type display names
const promptTypeNames: Record<PromptType, string> = {
  smart_validation: "SMART-валидация",
  task_dialog: "Диалог по задаче",
  risk_analysis: "Анализ рисков",
  comment_generation: "Генерация комментариев",
  progress_review: "Обзор прогресса",
};

// Prompt type icons
const promptTypeIcons: Record<PromptType, string> = {
  smart_validation: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  task_dialog: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  risk_analysis: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  comment_generation: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  progress_review: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
};

function AIModelCard({
  model,
  isSelected,
  onSelect,
  disabled,
}: {
  model: AIModelInfo;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{model.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                tierColors[model.tier]
              }`}
            >
              {tierLabels[model.tier]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{model.description}</p>
          <p className="text-xs text-gray-400 mt-1 font-mono">{model.id}</p>
        </div>
        <div className="shrink-0">
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
            }`}
          >
            {isSelected && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="3"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// AI Prompt Editor Card
function AIPromptCard({
  prompt,
  isExpanded,
  onToggle,
  onSave,
  onReset,
  isSaving,
  isResetting,
  disabled,
}: {
  prompt: AIPromptResponse;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (content: string) => void;
  onReset: () => void;
  isSaving: boolean;
  isResetting: boolean;
  disabled: boolean;
}) {
  const [editedContent, setEditedContent] = useState(prompt.content);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset edited content when prompt changes
  useEffect(() => {
    setEditedContent(prompt.content);
    setHasChanges(false);
  }, [prompt.content]);

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setHasChanges(value !== prompt.content);
  };

  const handleSave = () => {
    onSave(editedContent);
  };

  const handleCancel = () => {
    setEditedContent(prompt.content);
    setHasChanges(false);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={promptTypeIcons[prompt.prompt_type]}
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {promptTypeNames[prompt.prompt_type]}
              </span>
              {prompt.is_custom && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Изменён
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{prompt.info.description}</p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t bg-gray-50">
          {/* Variables hint */}
          {prompt.info.variables.length > 0 && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <span className="font-medium text-blue-700">Переменные: </span>
              <span className="text-blue-600">
                {prompt.info.variables.map((v) => `{${v}}`).join(", ")}
              </span>
            </div>
          )}

          {/* Editor */}
          <textarea
            value={editedContent}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={disabled}
            rows={12}
            className={`mt-3 w-full px-3 py-2 border rounded-lg font-mono text-sm resize-y ${
              disabled
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            }`}
            placeholder="Введите промпт..."
          />

          {/* Actions */}
          {!disabled && (
            <div className="mt-3 flex items-center justify-between">
              <div>
                {prompt.is_custom && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    disabled={isResetting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {isResetting ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : null}
                    Сбросить по умолчанию
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {hasChanges && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      Отменить
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : null}
                      Сохранить
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // AI Model settings
  const { data: aiSettings, isLoading, error } = useAISettings();
  const updateAISettings = useUpdateAISettings();

  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<AILanguage | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // AI Prompts
  const {
    data: promptsData,
    isLoading: promptsLoading,
    error: promptsError,
  } = useAIPrompts();
  const updatePrompt = useUpdateAIPrompt();
  const resetPrompt = useResetAIPrompt();
  const [expandedPrompt, setExpandedPrompt] = useState<PromptType | null>(null);
  const [savingPrompt, setSavingPrompt] = useState<PromptType | null>(null);
  const [resettingPrompt, setResettingPrompt] = useState<PromptType | null>(
    null
  );

  // Sync selected model and language with server data
  useEffect(() => {
    if (aiSettings?.model && !selectedModel) {
      setSelectedModel(aiSettings.model);
    }
    if (aiSettings?.language && !selectedLanguage) {
      setSelectedLanguage(aiSettings.language);
    }
  }, [aiSettings, selectedModel, selectedLanguage]);

  // Check for changes
  useEffect(() => {
    if (aiSettings?.model && selectedModel && aiSettings?.language && selectedLanguage) {
      const modelChanged = aiSettings.model !== selectedModel;
      const languageChanged = aiSettings.language !== selectedLanguage;
      setHasChanges(modelChanged || languageChanged);
    }
  }, [aiSettings, selectedModel, selectedLanguage]);

  const handleModelSelect = (model: AIModel) => {
    if (isAdmin) {
      setSelectedModel(model);
    }
  };

  const handleLanguageSelect = (language: AILanguage) => {
    if (isAdmin) {
      setSelectedLanguage(language);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    const updates: { model?: AIModel; language?: AILanguage } = {};
    if (selectedModel && aiSettings?.model !== selectedModel) {
      updates.model = selectedModel;
    }
    if (selectedLanguage && aiSettings?.language !== selectedLanguage) {
      updates.language = selectedLanguage;
    }

    if (Object.keys(updates).length > 0) {
      await updateAISettings.mutateAsync(updates);
    }
    setHasChanges(false);
  };

  const handleReset = () => {
    if (aiSettings?.model) {
      setSelectedModel(aiSettings.model);
    }
    if (aiSettings?.language) {
      setSelectedLanguage(aiSettings.language);
    }
    setHasChanges(false);
  };

  // Prompt handlers
  const handlePromptToggle = (promptType: PromptType) => {
    setExpandedPrompt(expandedPrompt === promptType ? null : promptType);
  };

  const handlePromptSave = async (promptType: PromptType, content: string) => {
    setSavingPrompt(promptType);
    try {
      await updatePrompt.mutateAsync({
        promptType,
        data: { content },
      });
    } finally {
      setSavingPrompt(null);
    }
  };

  const handlePromptReset = async (promptType: PromptType) => {
    setResettingPrompt(promptType);
    try {
      await resetPrompt.mutateAsync(promptType);
    } finally {
      setResettingPrompt(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600 mt-1">Управление настройками системы</p>
      </div>

      {/* AI Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <div>
              <CardTitle>Модель AI</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Выберите модель для AI-помощника
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Ошибка загрузки настроек</p>
              <p className="text-sm text-gray-500 mt-1">
                {error instanceof Error ? error.message : "Попробуйте позже"}
              </p>
            </div>
          ) : (
            <>
              {!isAdmin && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Только администраторы могут изменять настройки AI
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {aiSettings?.available_models.map((model) => (
                  <AIModelCard
                    key={model.id}
                    model={model}
                    isSelected={selectedModel === model.id}
                    onSelect={() => handleModelSelect(model.id as AIModel)}
                    disabled={!isAdmin}
                  />
                ))}
              </div>

              {isAdmin && hasChanges && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button variant="ghost" onClick={handleReset}>
                    Отменить
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={updateAISettings.isPending}
                  >
                    Сохранить изменения
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Language Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
                />
              </svg>
            </div>
            <div>
              <CardTitle>Язык AI-ответов</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Выберите язык, на котором AI будет отвечать
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Ошибка загрузки настроек</p>
            </div>
          ) : (
            <>
              {!isAdmin && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Только администраторы могут изменять язык AI
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {aiSettings?.available_languages.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.id as AILanguage)}
                    disabled={!isAdmin}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                      selectedLanguage === lang.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    } ${!isAdmin ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {lang.id === "ru" ? "🇷🇺" : "🇬🇧"}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{lang.name}</div>
                        <div className="text-sm text-gray-500">{lang.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {isAdmin && hasChanges && (
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button variant="ghost" onClick={handleReset}>
                    Отменить
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={updateAISettings.isPending}
                  >
                    Сохранить изменения
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Prompts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <div>
              <CardTitle>AI промпты</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Настройте промпты для различных AI-операций
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {promptsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : promptsError ? (
            <div className="text-center py-12">
              <p className="text-red-600">Ошибка загрузки промптов</p>
              <p className="text-sm text-gray-500 mt-1">
                {promptsError instanceof Error
                  ? promptsError.message
                  : "Попробуйте позже"}
              </p>
            </div>
          ) : (
            <>
              {!isAdmin && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Только администраторы могут изменять AI промпты
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {promptsData?.prompts.map((prompt) => (
                  <AIPromptCard
                    key={prompt.prompt_type}
                    prompt={prompt}
                    isExpanded={expandedPrompt === prompt.prompt_type}
                    onToggle={() => handlePromptToggle(prompt.prompt_type)}
                    onSave={(content) =>
                      handlePromptSave(prompt.prompt_type, content)
                    }
                    onReset={() => handlePromptReset(prompt.prompt_type)}
                    isSaving={savingPrompt === prompt.prompt_type}
                    isResetting={resettingPrompt === prompt.prompt_type}
                    disabled={!isAdmin}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for future settings */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
            </div>
            <div>
              <CardTitle className="text-gray-400">API ключ</CardTitle>
              <p className="text-sm text-gray-400 mt-0.5">
                Скоро: возможность использовать свой API ключ
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
