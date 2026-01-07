"""
SmartTask360 — System Settings Service
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.system_settings.models import SystemSetting
from app.modules.system_settings.schemas import (
    AIModel,
    AI_MODELS_INFO,
    AILanguage,
    AI_LANGUAGES_INFO,
    PromptType,
    PROMPTS_INFO,
)


# Setting keys
SETTING_AI_MODEL = "ai_model"
SETTING_AI_LANGUAGE = "ai_language"
SETTING_PROMPT_PREFIX = "ai_prompt_"  # ai_prompt_smart_validation, ai_prompt_task_dialog, etc.


class SystemSettingsService:
    """Service for managing system settings."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_setting(self, key: str) -> str | None:
        """Get a setting value by key."""
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        return setting.value if setting else None

    async def set_setting(
        self,
        key: str,
        value: str,
        user_id: UUID | None = None,
        description: str | None = None,
    ) -> SystemSetting:
        """Set a setting value (upsert)."""
        stmt = insert(SystemSetting).values(
            key=key,
            value=value,
            description=description,
            updated_by=user_id,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["key"],
            set_={
                "value": value,
                "updated_by": user_id,
            },
        )
        await self.db.execute(stmt)
        await self.db.commit()

        # Return the setting
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        return result.scalar_one()

    async def get_ai_model(self) -> str:
        """Get the current AI model setting."""
        model = await self.get_setting(SETTING_AI_MODEL)
        if model:
            # Validate it's a known model
            try:
                AIModel(model)
                return model
            except ValueError:
                pass
        # Return default from env
        return settings.AI_MODEL

    async def set_ai_model(self, model: AIModel, user_id: UUID | None = None) -> str:
        """Set the AI model."""
        await self.set_setting(
            key=SETTING_AI_MODEL,
            value=model.value,
            user_id=user_id,
            description="AI model for SMART validation and dialogs",
        )
        return model.value

    def get_available_models(self) -> list[dict]:
        """Get list of available AI models with info."""
        models = []
        for model_enum in AIModel:
            info = AI_MODELS_INFO.get(model_enum, {})
            models.append({
                "id": model_enum.value,
                "name": info.get("name", model_enum.value),
                "description": info.get("description", ""),
                "tier": info.get("tier", "standard"),
            })
        return models

    # ========================================================================
    # AI Language
    # ========================================================================

    async def get_ai_language(self) -> str:
        """Get the current AI language setting."""
        language = await self.get_setting(SETTING_AI_LANGUAGE)
        if language:
            try:
                AILanguage(language)
                return language
            except ValueError:
                pass
        # Default to Russian
        return AILanguage.RUSSIAN.value

    async def set_ai_language(self, language: AILanguage, user_id: UUID | None = None) -> str:
        """Set the AI language."""
        await self.set_setting(
            key=SETTING_AI_LANGUAGE,
            value=language.value,
            user_id=user_id,
            description="AI response language",
        )
        return language.value

    def get_available_languages(self) -> list[dict]:
        """Get list of available AI languages with info."""
        languages = []
        for lang_enum in AILanguage:
            info = AI_LANGUAGES_INFO.get(lang_enum, {})
            languages.append({
                "id": lang_enum.value,
                "name": info.get("name", lang_enum.value),
                "description": info.get("description", ""),
            })
        return languages

    # ========================================================================
    # AI Prompts
    # ========================================================================

    def _get_prompt_key(self, prompt_type: PromptType) -> str:
        """Get the setting key for a prompt type."""
        return f"{SETTING_PROMPT_PREFIX}{prompt_type.value}"

    async def get_prompt(self, prompt_type: PromptType) -> tuple[str, bool]:
        """
        Get a prompt by type.

        Returns:
            Tuple of (prompt_content, is_custom)
            is_custom is True if the prompt was customized (stored in DB)
        """
        key = self._get_prompt_key(prompt_type)
        custom_prompt = await self.get_setting(key)

        if custom_prompt:
            return custom_prompt, True

        # Return default from prompts module
        from app.modules.ai.prompts import get_default_prompt
        return get_default_prompt(prompt_type), False

    async def set_prompt(
        self,
        prompt_type: PromptType,
        content: str,
        user_id: UUID | None = None,
    ) -> None:
        """Set a custom prompt."""
        key = self._get_prompt_key(prompt_type)
        info = PROMPTS_INFO.get(prompt_type, {})
        await self.set_setting(
            key=key,
            value=content,
            user_id=user_id,
            description=info.get("description", f"Custom prompt for {prompt_type.value}"),
        )

    async def reset_prompt(self, prompt_type: PromptType) -> None:
        """Reset a prompt to default (delete custom version)."""
        key = self._get_prompt_key(prompt_type)
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        if setting:
            await self.db.delete(setting)
            await self.db.commit()

    async def get_all_prompts(self) -> list[dict]:
        """Get all prompts with their info."""
        prompts = []
        for prompt_type in PromptType:
            content, is_custom = await self.get_prompt(prompt_type)
            info = PROMPTS_INFO.get(prompt_type, {})
            prompts.append({
                "prompt_type": prompt_type,
                "content": content,
                "is_custom": is_custom,
                "info": {
                    "id": prompt_type.value,
                    "name": info.get("name", prompt_type.value),
                    "description": info.get("description", ""),
                    "variables": info.get("variables", []),
                },
            })
        return prompts
