"""
SmartTask360 — AI Prompts

Structured prompts for different AI operations.
"""

from typing import Any


def build_smart_validation_prompt(
    title: str, description: str, context: dict[str, Any] | None = None
) -> str:
    """
    Build enhanced SMART validation prompt with examples and best practices.

    Returns detailed, consistent evaluation of task against SMART criteria.
    """

    prompt = f"""You are an expert task management consultant. Analyze this task against SMART criteria and provide actionable feedback.

TASK TO ANALYZE:
Title: {title}
Description: {description or "No description provided"}
"""

    # Add context if available
    if context:
        if context.get("priority"):
            prompt += f"Priority: {context['priority']}\n"
        if context.get("status"):
            prompt += f"Status: {context['status']}\n"
        if context.get("parent_task"):
            parent = context["parent_task"]
            prompt += f"\nParent Task Context:\n"
            prompt += f"  Title: {parent.get('title', 'N/A')}\n"
            if parent.get("description"):
                prompt += f"  Description: {parent['description']}\n"

    prompt += """

SMART CRITERIA EVALUATION GUIDE:

**Specific (S):**
- Does the task clearly define WHAT needs to be done?
- Are the deliverables and outcomes explicit?
- Would someone else understand exactly what to do?

High Score Example (0.9):
"Implement JWT-based authentication with email/password login, including token refresh mechanism and password reset flow. Use bcrypt for hashing with cost factor 12."

Low Score Example (0.3):
"Add authentication to the system"

**Measurable (M):**
- Can progress be tracked quantitatively?
- Are there clear success criteria?
- How will completion be verified?

High Score Example (0.9):
"Achieve 95% test coverage on authentication module, all endpoints respond within 200ms, support 1000 concurrent users"

Low Score Example (0.3):
"Make authentication work well"

**Achievable (A):**
- Is the scope realistic given typical constraints?
- Are there any obvious blockers?
- Does it require reasonable effort and skills?

High Score Example (0.9):
"Implement standard OAuth2 flow using well-documented library (e.g., Passport.js) - estimated 3-5 days"

Low Score Example (0.3):
"Build a quantum-encrypted authentication system by tomorrow"

**Relevant (R):**
- Does it align with broader project/business goals?
- Is it important and impactful?
- Should this be prioritized now?

High Score Example (0.9):
"Required for Phase 1 launch - blocks user registration and data security compliance. Direct revenue impact."

Low Score Example (0.3):
"Add authentication because other apps have it"

**Time-bound (T):**
- Is there a clear deadline or timeframe?
- Are milestones defined?
- Is urgency indicated?

High Score Example (0.9):
"Complete by March 15, 2024. Checkpoint: API endpoints by March 8, UI integration by March 12"

Low Score Example (0.3):
"Sometime soon" or "When possible"

SCORING GUIDELINES:
- 0.9-1.0: Excellent - meets criterion fully with specifics
- 0.7-0.8: Good - meets criterion with minor gaps
- 0.5-0.6: Fair - partially meets criterion, needs improvement
- 0.3-0.4: Poor - barely addresses criterion
- 0.0-0.2: Missing - criterion not addressed

IMPORTANT: Respond with ONLY valid JSON in this exact format (no markdown, no extra text):

{
  "overall_score": 0.75,
  "is_valid": true,
  "criteria": [
    {
      "name": "Specific",
      "score": 0.8,
      "explanation": "Clear technical direction (JWT, email/password) but missing some details like token expiration, session management strategy, and error handling approach.",
      "suggestions": [
        "Specify token expiration times (e.g., access: 15min, refresh: 7 days)",
        "Define error codes and messages for failed auth attempts",
        "Clarify session management approach (stateless vs stateful)"
      ]
    },
    {
      "name": "Measurable",
      "score": 0.6,
      "explanation": "Implementation can be tracked but lacks quantitative success metrics.",
      "suggestions": [
        "Add test coverage target (e.g., 90% coverage on auth module)",
        "Define performance benchmark (e.g., login < 200ms response time)",
        "Specify acceptance criteria (e.g., '100 concurrent logins without errors')"
      ]
    },
    {
      "name": "Achievable",
      "score": 0.8,
      "explanation": "Standard authentication is well-documented and realistic. Scope appears appropriate for experienced team.",
      "suggestions": [
        "Consider using established library (e.g., passport, python-jose) to reduce risk",
        "Estimate effort (e.g., 3-5 days for backend, 2 days for integration)"
      ]
    },
    {
      "name": "Relevant",
      "score": 0.7,
      "explanation": "Authentication is fundamental for most applications, though business context not stated.",
      "suggestions": [
        "Link to business requirement (e.g., 'Required for GDPR compliance')",
        "Note dependencies (e.g., 'Blocks user profile features')",
        "Indicate priority rationale"
      ]
    },
    {
      "name": "Time-bound",
      "score": 0.4,
      "explanation": "No deadline or timeframe specified.",
      "suggestions": [
        "Add target completion date (e.g., 'Complete by March 15')",
        "Define milestones (e.g., 'API ready by March 8, UI by March 12')",
        "Indicate urgency level"
      ]
    }
  ],
  "summary": "The task has clear technical direction (JWT authentication) but lacks specific implementation details, measurable success criteria, and any time constraints. Adding quantitative metrics, estimated timeline, and detailed requirements would make this fully SMART.",
  "recommended_changes": [
    "Add specific technical details: token expiration, error handling, session strategy",
    "Define measurable criteria: test coverage %, performance benchmarks, acceptance tests",
    "Set clear deadline with milestones (e.g., 'Complete by [date], checkpoints on [dates]')",
    "Add business context: why this matters, what it blocks, compliance needs"
  ]
}

CRITICAL: Return ONLY the JSON object above. No other text, no markdown blocks, no explanations outside the JSON."""

    return prompt


def build_task_dialog_prompt(
    task_title: str,
    task_description: str,
    conversation_history: list[dict[str, str]],
    context: dict[str, Any] | None = None,
) -> str:
    """
    Build prompt for interactive task clarification dialog.

    AI acts as consultant asking clarifying questions and refining requirements.
    """

    system_prompt = """You are a task management consultant helping to clarify and refine task requirements.

Your role is to:
1. Ask specific, targeted questions to uncover missing details
2. Suggest concrete improvements to make tasks more actionable
3. Help break down complex tasks into manageable subtasks
4. Ensure alignment with SMART criteria

Be concise, practical, and focus on actionable outcomes.
Avoid generic advice - provide specific suggestions based on the task context."""

    # This will be used as system parameter in API call
    return system_prompt


def build_risk_analysis_prompt(
    task_title: str, task_description: str, context: dict[str, Any] | None = None
) -> str:
    """
    Build prompt for task risk analysis.

    AI identifies potential risks, blockers, and mitigation strategies.
    """

    prompt = f"""Analyze potential risks and challenges for this task:

Task: {task_title}
Description: {task_description or "No description"}
"""

    if context:
        if context.get("priority"):
            prompt += f"Priority: {context['priority']}\n"
        if context.get("estimated_hours"):
            prompt += f"Estimated Hours: {context['estimated_hours']}\n"

    prompt += """

Identify:
1. Technical Risks: Dependencies, complexity, unknowns
2. Resource Risks: Skills, availability, tools needed
3. Schedule Risks: Unrealistic estimates, blocking dependencies
4. Quality Risks: Testing gaps, edge cases, error handling

For each risk, provide:
- Severity: High/Medium/Low
- Probability: High/Medium/Low
- Impact description
- Mitigation strategy

Return ONLY valid JSON:
{
  "overall_risk_level": "Medium",
  "risks": [
    {
      "category": "Technical",
      "severity": "High",
      "probability": "Medium",
      "description": "JWT library may have security vulnerabilities",
      "mitigation": "Use well-maintained library, enable security scanning, plan for updates"
    }
  ],
  "recommendations": [
    "Add buffer time for security review",
    "Plan spike to evaluate JWT libraries"
  ]
}
"""

    return prompt


def build_comment_generation_prompt(
    task_title: str,
    task_description: str,
    comment_type: str,
    context: dict[str, Any] | None = None,
) -> str:
    """
    Build prompt for AI comment generation.

    Generates insightful comments based on task analysis.
    """

    base_context = f"""Task: {task_title}
Description: {task_description or "No description"}
"""

    if context:
        if context.get("status"):
            base_context += f"Status: {context['status']}\n"
        if context.get("priority"):
            base_context += f"Priority: {context['priority']}\n"
        if context.get("assignee"):
            base_context += f"Assignee: {context['assignee']}\n"

    if comment_type == "insight":
        prompt = f"""{base_context}

Generate an insightful comment about this task. Focus on:
- Key considerations or gotchas
- Best practices to follow
- Potential improvements
- Hidden complexity

Be concise (2-3 sentences), practical, and specific to this task."""

    elif comment_type == "risk":
        prompt = f"""{base_context}

Identify the top risk for this task and suggest mitigation.

Focus on the SINGLE most likely blocker or challenge.
Be specific and actionable (1-2 sentences)."""

    elif comment_type == "progress":
        prompt = f"""{base_context}

Based on the task status and description, provide a progress check comment.

Suggest next steps or highlight what should be prioritized (2-3 sentences)."""

    elif comment_type == "blocker":
        prompt = f"""{base_context}

Analyze this task for potential blockers or dependencies.

Identify what might prevent completion and suggest how to address it (2-3 sentences)."""

    elif comment_type == "suggestion":
        prompt = f"""{base_context}

Provide a helpful suggestion to improve this task.

Focus on making it more specific, measurable, or achievable (2-3 sentences)."""

    else:  # general
        prompt = f"""{base_context}

Generate a helpful comment about this task (2-3 sentences)."""

    return prompt


def build_progress_review_prompt(
    task_title: str,
    task_description: str,
    task_status: str,
    subtasks: list[dict[str, Any]] | None = None,
    context: dict[str, Any] | None = None,
) -> str:
    """
    Build prompt for progress review.

    AI reviews task progress and provides insights.
    """

    prompt = f"""Review progress for this task:

Task: {task_title}
Description: {task_description or "No description"}
Current Status: {task_status}
"""

    if context:
        if context.get("created_at"):
            prompt += f"Created: {context['created_at']}\n"
        if context.get("estimated_hours"):
            prompt += f"Estimated: {context['estimated_hours']} hours\n"

    if subtasks:
        prompt += f"\nSubtasks ({len(subtasks)} total):\n"
        for st in subtasks[:5]:  # Show max 5 subtasks
            status = st.get("status", "unknown")
            title = st.get("title", "")
            prompt += f"  [{status}] {title}\n"

        if len(subtasks) > 5:
            prompt += f"  ... and {len(subtasks) - 5} more\n"

    prompt += """

Provide a progress review with:
1. Overall progress assessment (on track / at risk / blocked)
2. What's going well
3. Concerns or blockers
4. Recommended next steps

Return ONLY valid JSON:
{
  "progress_status": "on_track",
  "completion_estimate": "70%",
  "summary": "Good progress on core features...",
  "going_well": ["Backend API complete", "Testing framework set up"],
  "concerns": ["Frontend integration delayed", "No error handling yet"],
  "next_steps": ["Implement error handling", "Start frontend integration", "Add integration tests"],
  "risk_level": "Low"
}
"""

    return prompt
