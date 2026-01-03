"""
SmartTask360 — Workflow service (business logic)
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.workflow.models import StatusTransition, WorkflowTemplate
from app.modules.workflow.schemas import (
    StatusDefinition,
    StatusTransitionCreate,
    StatusTransitionUpdate,
    TransitionValidationResponse,
    WorkflowTemplateCreate,
    WorkflowTemplateUpdate,
)


class WorkflowService:
    """Service for workflow template and transition management"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ===== Workflow Template CRUD =====

    async def create_template(self, template_data: WorkflowTemplateCreate) -> WorkflowTemplate:
        """Create a new workflow template"""
        # Convert statuses list to dict format for storage
        statuses_dict = {"statuses": [s.model_dump() for s in template_data.statuses]}

        # Validate initial_status exists in statuses
        status_keys = [s.key for s in template_data.statuses]
        if template_data.initial_status not in status_keys:
            raise ValueError(f"initial_status '{template_data.initial_status}' not found in statuses")

        # Validate final_statuses exist in statuses
        for final_status in template_data.final_statuses:
            if final_status not in status_keys:
                raise ValueError(f"final_status '{final_status}' not found in statuses")

        template = WorkflowTemplate(
            name=template_data.name,
            display_name=template_data.display_name,
            description=template_data.description,
            statuses=statuses_dict,
            initial_status=template_data.initial_status,
            final_statuses=template_data.final_statuses,
            is_system=False,
        )

        self.db.add(template)
        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def get_template_by_id(self, template_id: UUID) -> WorkflowTemplate | None:
        """Get workflow template by ID"""
        result = await self.db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def get_template_by_name(self, name: str) -> WorkflowTemplate | None:
        """Get workflow template by name"""
        result = await self.db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.name == name)
        )
        return result.scalar_one_or_none()

    async def list_templates(
        self, skip: int = 0, limit: int = 100, active_only: bool = False
    ) -> list[WorkflowTemplate]:
        """List all workflow templates"""
        query = select(WorkflowTemplate)

        if active_only:
            query = query.where(WorkflowTemplate.is_active == True)

        query = query.offset(skip).limit(limit).order_by(WorkflowTemplate.name)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_template(
        self, template_id: UUID, template_data: WorkflowTemplateUpdate
    ) -> WorkflowTemplate | None:
        """Update workflow template (only non-system templates)"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return None

        if template.is_system:
            raise ValueError("Cannot update system templates")

        # Update fields
        if template_data.display_name is not None:
            template.display_name = template_data.display_name

        if template_data.description is not None:
            template.description = template_data.description

        if template_data.statuses is not None:
            statuses_dict = {"statuses": [s.model_dump() for s in template_data.statuses]}
            template.statuses = statuses_dict

        if template_data.initial_status is not None:
            template.initial_status = template_data.initial_status

        if template_data.final_statuses is not None:
            template.final_statuses = template_data.final_statuses

        if template_data.is_active is not None:
            template.is_active = template_data.is_active

        await self.db.commit()
        await self.db.refresh(template)
        return template

    async def delete_template(self, template_id: UUID) -> bool:
        """Delete workflow template (only non-system templates)"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return False

        if template.is_system:
            raise ValueError("Cannot delete system templates")

        await self.db.delete(template)
        await self.db.commit()
        return True

    # ===== Status Transition CRUD =====

    async def create_transition(
        self, transition_data: StatusTransitionCreate
    ) -> StatusTransition:
        """Create a new status transition"""
        # Validate template exists
        template = await self.get_template_by_id(transition_data.template_id)
        if not template:
            raise ValueError(f"Template {transition_data.template_id} not found")

        # Validate statuses exist in template
        status_keys = [s["key"] for s in template.statuses["statuses"]]
        if transition_data.from_status not in status_keys:
            raise ValueError(f"from_status '{transition_data.from_status}' not found in template")
        if transition_data.to_status not in status_keys:
            raise ValueError(f"to_status '{transition_data.to_status}' not found in template")

        transition = StatusTransition(
            template_id=transition_data.template_id,
            from_status=transition_data.from_status,
            to_status=transition_data.to_status,
            allowed_roles=transition_data.allowed_roles,
            requires_comment=transition_data.requires_comment,
            requires_acceptance=transition_data.requires_acceptance,
            validation_rules=transition_data.validation_rules,
            display_order=transition_data.display_order,
        )

        self.db.add(transition)
        await self.db.commit()
        await self.db.refresh(transition)
        return transition

    async def get_transition_by_id(self, transition_id: UUID) -> StatusTransition | None:
        """Get status transition by ID"""
        result = await self.db.execute(
            select(StatusTransition).where(StatusTransition.id == transition_id)
        )
        return result.scalar_one_or_none()

    async def list_transitions(
        self, template_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[StatusTransition]:
        """List all transitions for a template"""
        result = await self.db.execute(
            select(StatusTransition)
            .where(StatusTransition.template_id == template_id)
            .order_by(StatusTransition.display_order, StatusTransition.from_status)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def update_transition(
        self, transition_id: UUID, transition_data: StatusTransitionUpdate
    ) -> StatusTransition | None:
        """Update status transition"""
        transition = await self.get_transition_by_id(transition_id)
        if not transition:
            return None

        if transition_data.allowed_roles is not None:
            transition.allowed_roles = transition_data.allowed_roles

        if transition_data.requires_comment is not None:
            transition.requires_comment = transition_data.requires_comment

        if transition_data.requires_acceptance is not None:
            transition.requires_acceptance = transition_data.requires_acceptance

        if transition_data.validation_rules is not None:
            transition.validation_rules = transition_data.validation_rules

        if transition_data.display_order is not None:
            transition.display_order = transition_data.display_order

        await self.db.commit()
        await self.db.refresh(transition)
        return transition

    async def delete_transition(self, transition_id: UUID) -> bool:
        """Delete status transition"""
        transition = await self.get_transition_by_id(transition_id)
        if not transition:
            return False

        await self.db.delete(transition)
        await self.db.commit()
        return True

    # ===== Transition Validation =====

    async def validate_transition(
        self,
        template_id: UUID,
        from_status: str,
        to_status: str,
        user_role: str,
        has_comment: bool = False,
    ) -> TransitionValidationResponse:
        """
        Validate if a status transition is allowed

        Returns validation result with details about why it failed (if it did)
        """
        # Find transition rule
        result = await self.db.execute(
            select(StatusTransition)
            .where(StatusTransition.template_id == template_id)
            .where(StatusTransition.from_status == from_status)
            .where(StatusTransition.to_status == to_status)
        )
        transition = result.scalar_one_or_none()

        # No transition rule = not allowed
        if not transition:
            return TransitionValidationResponse(
                is_valid=False,
                message=f"Transition from '{from_status}' to '{to_status}' is not allowed",
            )

        required_fields = []

        # Check role requirements
        if transition.allowed_roles and user_role not in transition.allowed_roles:
            return TransitionValidationResponse(
                is_valid=False,
                message=f"Role '{user_role}' is not allowed to perform this transition",
            )

        # Check comment requirement
        if transition.requires_comment and not has_comment:
            required_fields.append("comment")

        # If any required fields are missing
        if required_fields:
            return TransitionValidationResponse(
                is_valid=False,
                message="Missing required fields for this transition",
                required_fields=required_fields,
            )

        # All checks passed
        return TransitionValidationResponse(
            is_valid=True, message="Transition is allowed"
        )

    async def get_available_transitions(
        self, template_id: UUID, current_status: str, user_role: str
    ) -> list[StatusTransition]:
        """
        Get all available transitions from current status for a given user role

        Returns list of transitions the user is allowed to make
        """
        result = await self.db.execute(
            select(StatusTransition)
            .where(StatusTransition.template_id == template_id)
            .where(StatusTransition.from_status == current_status)
            .order_by(StatusTransition.display_order)
        )
        all_transitions = result.scalars().all()

        # Filter by role
        available = []
        for transition in all_transitions:
            # Empty allowed_roles means all roles can use it
            if not transition.allowed_roles or user_role in transition.allowed_roles:
                available.append(transition)

        return available
