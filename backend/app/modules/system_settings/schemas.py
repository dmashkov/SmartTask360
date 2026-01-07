"""
SmartTask360 — System Settings Schemas
"""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class AIModel(str, Enum):
    """Available AI models."""
    # Claude 4 (Sonnet)
    CLAUDE_SONNET_4 = "claude-sonnet-4-20250514"
    # Claude 3.5 models
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20241022"
    CLAUDE_3_5_HAIKU = "claude-3-5-haiku-20241022"
    # Claude 3 models
    CLAUDE_3_OPUS = "claude-3-opus-20240229"
    CLAUDE_3_SONNET = "claude-3-sonnet-20240229"
    CLAUDE_3_HAIKU = "claude-3-haiku-20240307"


class AILanguage(str, Enum):
    """Available AI response languages."""
    RUSSIAN = "ru"
    ENGLISH = "en"


AI_LANGUAGES_INFO = {
    AILanguage.RUSSIAN: {
        "name": "Русский",
        "description": "AI отвечает на русском языке",
    },
    AILanguage.ENGLISH: {
        "name": "English",
        "description": "AI responds in English",
    },
}


# Model info for frontend display
AI_MODELS_INFO = {
    AIModel.CLAUDE_SONNET_4: {
        "name": "Claude Sonnet 4",
        "description": "Новейшая модель. Лучший баланс качества и скорости.",
        "tier": "recommended",
    },
    AIModel.CLAUDE_3_5_SONNET: {
        "name": "Claude 3.5 Sonnet",
        "description": "Высокое качество, умеренная стоимость.",
        "tier": "standard",
    },
    AIModel.CLAUDE_3_5_HAIKU: {
        "name": "Claude 3.5 Haiku",
        "description": "Быстрая и экономичная модель.",
        "tier": "economy",
    },
    AIModel.CLAUDE_3_OPUS: {
        "name": "Claude 3 Opus",
        "description": "Максимальное качество, высокая стоимость.",
        "tier": "premium",
    },
    AIModel.CLAUDE_3_SONNET: {
        "name": "Claude 3 Sonnet",
        "description": "Предыдущее поколение, хорошее качество.",
        "tier": "standard",
    },
    AIModel.CLAUDE_3_HAIKU: {
        "name": "Claude 3 Haiku",
        "description": "Самая быстрая и дешёвая модель.",
        "tier": "economy",
    },
}


class SystemSettingResponse(BaseModel):
    """Response for a single setting."""
    id: UUID
    key: str
    value: str
    description: str | None
    updated_at: datetime
    updated_by: UUID | None

    model_config = {"from_attributes": True}


class AISettingsResponse(BaseModel):
    """AI settings response."""
    model: AIModel = Field(default=AIModel.CLAUDE_SONNET_4)
    language: AILanguage = Field(default=AILanguage.RUSSIAN)
    available_models: list[dict] = Field(default_factory=list)
    available_languages: list[dict] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class AISettingsUpdate(BaseModel):
    """AI settings update request."""
    model: AIModel | None = None
    language: AILanguage | None = None


class AIModelInfo(BaseModel):
    """AI model information for display."""
    id: str
    name: str
    description: str
    tier: str  # recommended, premium, standard, economy


# ============================================================================
# AI Prompts Settings
# ============================================================================


class PromptType(str, Enum):
    """Types of AI prompts."""
    SMART_VALIDATION = "smart_validation"
    TASK_DIALOG = "task_dialog"
    RISK_ANALYSIS = "risk_analysis"
    COMMENT_GENERATION = "comment_generation"
    PROGRESS_REVIEW = "progress_review"


# Prompt metadata for display
PROMPTS_INFO = {
    PromptType.SMART_VALIDATION: {
        "name": "SMART-валидация",
        "description": "Промпт для проверки задачи на соответствие SMART-критериям",
        "variables": ["title", "description", "priority", "status", "parent_task"],
    },
    PromptType.TASK_DIALOG: {
        "name": "Диалог по задаче",
        "description": "Системный промпт для интерактивного диалога по задаче",
        "variables": ["task_title", "task_description"],
    },
    PromptType.RISK_ANALYSIS: {
        "name": "Анализ рисков",
        "description": "Промпт для анализа рисков и блокеров задачи",
        "variables": ["title", "description", "priority", "estimated_hours"],
    },
    PromptType.COMMENT_GENERATION: {
        "name": "Генерация комментария",
        "description": "Промпт для генерации AI-комментариев к задаче",
        "variables": ["title", "description", "status", "priority", "comment_type"],
    },
    PromptType.PROGRESS_REVIEW: {
        "name": "Обзор прогресса",
        "description": "Промпт для анализа прогресса выполнения задачи",
        "variables": ["title", "description", "status", "subtasks", "created_at", "estimated_hours"],
    },
}


class AIPromptInfo(BaseModel):
    """AI prompt information for display."""
    id: str
    name: str
    description: str
    variables: list[str]


class AIPromptResponse(BaseModel):
    """Single AI prompt response."""
    prompt_type: PromptType
    content: str
    is_custom: bool = Field(description="True if prompt was customized")
    info: AIPromptInfo


class AIPromptsResponse(BaseModel):
    """All AI prompts response."""
    prompts: list[AIPromptResponse]


class AIPromptUpdate(BaseModel):
    """Update request for a single prompt (prompt_type from URL path)."""
    content: str


class AIPromptReset(BaseModel):
    """Reset prompt to default (prompt_type from URL path)."""
    pass  # All info comes from URL path
