"""
SmartTask360 — Workflow API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.users.models import User
from app.modules.workflow.schemas import (
    StatusTransitionCreate,
    StatusTransitionResponse,
    StatusTransitionUpdate,
    TransitionValidationRequest,
    TransitionValidationResponse,
    WorkflowTemplateCreate,
    WorkflowTemplateResponse,
    WorkflowTemplateUpdate,
)
from app.modules.workflow.service import WorkflowService

router = APIRouter(prefix="/workflow", tags=["workflow"])


# ===== Workflow Template Endpoints =====


@router.post("/templates", response_model=WorkflowTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow_template(
    template_data: WorkflowTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new workflow template"""
    service = WorkflowService(db)

    try:
        template = await service.create_template(template_data)
        return template
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/templates", response_model=list[WorkflowTemplateResponse])
async def list_workflow_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    active_only: bool = Query(False, description="Only return active templates"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all workflow templates"""
    service = WorkflowService(db)
    templates = await service.list_templates(skip=skip, limit=limit, active_only=active_only)
    return templates


@router.get("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def get_workflow_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get workflow template by ID"""
    service = WorkflowService(db)
    template = await service.get_template_by_id(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow template not found"
        )

    return template


@router.get("/templates/by-name/{name}", response_model=WorkflowTemplateResponse)
async def get_workflow_template_by_name(
    name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get workflow template by name"""
    service = WorkflowService(db)
    template = await service.get_template_by_name(name)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow template '{name}' not found",
        )

    return template


@router.patch("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def update_workflow_template(
    template_id: UUID,
    template_data: WorkflowTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update workflow template (only non-system templates)"""
    service = WorkflowService(db)

    try:
        template = await service.update_template(template_id, template_data)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Workflow template not found"
            )
        return template
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete workflow template (only non-system templates)"""
    service = WorkflowService(db)

    try:
        deleted = await service.delete_template(template_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Workflow template not found"
            )
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ===== Status Transition Endpoints =====


@router.post("/transitions", response_model=StatusTransitionResponse, status_code=status.HTTP_201_CREATED)
async def create_status_transition(
    transition_data: StatusTransitionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new status transition"""
    service = WorkflowService(db)

    try:
        transition = await service.create_transition(transition_data)
        return transition
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/templates/{template_id}/transitions", response_model=list[StatusTransitionResponse])
async def list_template_transitions(
    template_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all transitions for a workflow template"""
    service = WorkflowService(db)
    transitions = await service.list_transitions(template_id, skip=skip, limit=limit)
    return transitions


@router.get("/transitions/{transition_id}", response_model=StatusTransitionResponse)
async def get_status_transition(
    transition_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get status transition by ID"""
    service = WorkflowService(db)
    transition = await service.get_transition_by_id(transition_id)

    if not transition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Status transition not found"
        )

    return transition


@router.patch("/transitions/{transition_id}", response_model=StatusTransitionResponse)
async def update_status_transition(
    transition_id: UUID,
    transition_data: StatusTransitionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update status transition"""
    service = WorkflowService(db)
    transition = await service.update_transition(transition_id, transition_data)

    if not transition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Status transition not found"
        )

    return transition


@router.delete("/transitions/{transition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_status_transition(
    transition_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete status transition"""
    service = WorkflowService(db)
    deleted = await service.delete_transition(transition_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Status transition not found"
        )

    return None


# ===== Transition Validation Endpoints =====


@router.post("/validate-transition", response_model=TransitionValidationResponse)
async def validate_transition(
    validation_request: TransitionValidationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validate if a status transition is allowed

    Checks:
    - Transition exists in workflow
    - User role has permission
    - Required fields are provided (e.g., comment)
    """
    service = WorkflowService(db)
    result = await service.validate_transition(
        template_id=validation_request.template_id,
        from_status=validation_request.from_status,
        to_status=validation_request.to_status,
        user_role=validation_request.user_role,
        has_comment=validation_request.has_comment,
    )
    return result


@router.get(
    "/templates/{template_id}/available-transitions",
    response_model=list[StatusTransitionResponse],
)
async def get_available_transitions(
    template_id: UUID,
    current_status: str = Query(..., description="Current task status"),
    user_role: str = Query(..., description="User's role"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all available transitions from current status for a user

    Returns only transitions the user is allowed to make based on their role
    """
    service = WorkflowService(db)
    transitions = await service.get_available_transitions(
        template_id=template_id, current_status=current_status, user_role=user_role
    )
    return transitions
