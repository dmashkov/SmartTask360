"""
SmartTask360 — System Settings Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.users.models import User
from app.modules.system_settings.schemas import (
    AISettingsResponse,
    AISettingsUpdate,
    AIModel,
    AILanguage,
    AIPromptsResponse,
    AIPromptResponse,
    AIPromptUpdate,
    AIPromptReset,
    AIPromptInfo,
    PromptType,
)
from app.modules.system_settings.service import SystemSettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/ai", response_model=AISettingsResponse)
async def get_ai_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AISettingsResponse:
    """
    Get current AI settings.

    Returns the current AI model, language, and available options.
    """
    service = SystemSettingsService(db)

    current_model = await service.get_ai_model()
    current_language = await service.get_ai_language()
    available_models = service.get_available_models()
    available_languages = service.get_available_languages()

    return AISettingsResponse(
        model=AIModel(current_model),
        language=AILanguage(current_language),
        available_models=available_models,
        available_languages=available_languages,
    )


@router.put("/ai", response_model=AISettingsResponse)
async def update_ai_settings(
    data: AISettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AISettingsResponse:
    """
    Update AI settings.

    Only admins can update AI settings.
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can update AI settings",
        )

    service = SystemSettingsService(db)

    # Update model if provided
    if data.model is not None:
        await service.set_ai_model(data.model, user_id=current_user.id)

    # Update language if provided
    if data.language is not None:
        await service.set_ai_language(data.language, user_id=current_user.id)

    # Return updated settings
    current_model = await service.get_ai_model()
    current_language = await service.get_ai_language()
    available_models = service.get_available_models()
    available_languages = service.get_available_languages()

    return AISettingsResponse(
        model=AIModel(current_model),
        language=AILanguage(current_language),
        available_models=available_models,
        available_languages=available_languages,
    )


# ============================================================================
# AI Prompts Endpoints
# ============================================================================


@router.get("/ai/prompts", response_model=AIPromptsResponse)
async def get_ai_prompts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIPromptsResponse:
    """
    Get all AI prompts with their info.

    Returns all prompt templates (custom or default) with metadata.
    """
    service = SystemSettingsService(db)
    prompts = await service.get_all_prompts()

    return AIPromptsResponse(prompts=prompts)


@router.get("/ai/prompts/{prompt_type}", response_model=AIPromptResponse)
async def get_ai_prompt(
    prompt_type: PromptType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIPromptResponse:
    """
    Get a specific AI prompt by type.
    """
    from app.modules.system_settings.schemas import PROMPTS_INFO

    service = SystemSettingsService(db)
    content, is_custom = await service.get_prompt(prompt_type)

    info = PROMPTS_INFO.get(prompt_type, {})

    return AIPromptResponse(
        prompt_type=prompt_type,
        content=content,
        is_custom=is_custom,
        info=AIPromptInfo(
            id=prompt_type.value,
            name=info.get("name", prompt_type.value),
            description=info.get("description", ""),
            variables=info.get("variables", []),
        ),
    )


@router.put("/ai/prompts/{prompt_type}", response_model=AIPromptResponse)
async def update_ai_prompt(
    prompt_type: PromptType,
    data: AIPromptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIPromptResponse:
    """
    Update an AI prompt.

    Only admins can update prompts.
    """
    from app.modules.system_settings.schemas import PROMPTS_INFO

    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can update AI prompts",
        )

    service = SystemSettingsService(db)

    # Update prompt
    await service.set_prompt(prompt_type, data.content, user_id=current_user.id)

    # Return updated prompt
    content, is_custom = await service.get_prompt(prompt_type)
    info = PROMPTS_INFO.get(prompt_type, {})

    return AIPromptResponse(
        prompt_type=prompt_type,
        content=content,
        is_custom=is_custom,
        info=AIPromptInfo(
            id=prompt_type.value,
            name=info.get("name", prompt_type.value),
            description=info.get("description", ""),
            variables=info.get("variables", []),
        ),
    )


@router.delete("/ai/prompts/{prompt_type}", response_model=AIPromptResponse)
async def reset_ai_prompt(
    prompt_type: PromptType,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AIPromptResponse:
    """
    Reset an AI prompt to its default value.

    Only admins can reset prompts.
    """
    from app.modules.system_settings.schemas import PROMPTS_INFO

    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can reset AI prompts",
        )

    service = SystemSettingsService(db)

    # Reset prompt (delete custom version)
    await service.reset_prompt(prompt_type)

    # Return default prompt
    content, is_custom = await service.get_prompt(prompt_type)
    info = PROMPTS_INFO.get(prompt_type, {})

    return AIPromptResponse(
        prompt_type=prompt_type,
        content=content,
        is_custom=is_custom,
        info=AIPromptInfo(
            id=prompt_type.value,
            name=info.get("name", prompt_type.value),
            description=info.get("description", ""),
            variables=info.get("variables", []),
        ),
    )
