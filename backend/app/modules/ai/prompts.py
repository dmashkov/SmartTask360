"""
SmartTask360 — AI Prompts

Structured prompts for different AI operations.
Supports configurable prompts from system settings with fallback to defaults.
"""

from typing import Any


# ============================================================================
# Default Prompt Templates
# These are stored as templates with {variable} placeholders
# ============================================================================


DEFAULT_SMART_VALIDATION_PROMPT = """You are an expert task management consultant. Analyze this task against SMART criteria and provide actionable feedback.

TASK TO ANALYZE:
Title: {title}
Description: {description}
{context_section}

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

{{
  "overall_score": 0.75,
  "is_valid": true,
  "criteria": [
    {{
      "name": "Specific",
      "score": 0.8,
      "explanation": "Clear technical direction but missing some details.",
      "suggestions": ["Add specific technical details", "Define error handling"]
    }},
    {{
      "name": "Measurable",
      "score": 0.6,
      "explanation": "Implementation can be tracked but lacks quantitative success metrics.",
      "suggestions": ["Add test coverage target", "Define performance benchmark"]
    }},
    {{
      "name": "Achievable",
      "score": 0.8,
      "explanation": "Scope appears appropriate for experienced team.",
      "suggestions": ["Consider using established library", "Estimate effort"]
    }},
    {{
      "name": "Relevant",
      "score": 0.7,
      "explanation": "Fundamental for most applications, though business context not stated.",
      "suggestions": ["Link to business requirement", "Note dependencies"]
    }},
    {{
      "name": "Time-bound",
      "score": 0.4,
      "explanation": "No deadline or timeframe specified.",
      "suggestions": ["Add target completion date", "Define milestones"]
    }}
  ],
  "summary": "Summary of the SMART analysis...",
  "recommended_changes": [
    "Add specific technical details",
    "Define measurable criteria",
    "Set clear deadline with milestones"
  ],
  "acceptance_criteria": [
    {{
      "description": "User can perform the main action",
      "verification": "Test the main functionality"
    }},
    {{
      "description": "Error cases are handled",
      "verification": "Test with invalid inputs"
    }}
  ]
}}

CRITICAL: Return ONLY the JSON object above. No other text, no markdown blocks, no explanations outside the JSON.

NOTE ON acceptance_criteria: Generate 3-5 specific, testable acceptance criteria based on the task. Each criterion should:
- Be verifiable (can be checked as done/not done)
- Focus on the outcome, not the process
- Be specific to this task
- Include verification method (how to test it)

{language_instruction}"""


DEFAULT_TASK_DIALOG_PROMPT = """You are a task management consultant helping to clarify and refine task requirements.

Your role is to:
1. Ask specific, targeted questions to uncover missing details
2. Suggest concrete improvements to make tasks more actionable
3. Help break down complex tasks into manageable subtasks
4. Ensure alignment with SMART criteria

Be concise, practical, and focus on actionable outcomes.
Avoid generic advice - provide specific suggestions based on the task context.

{language_instruction}"""


DEFAULT_RISK_ANALYSIS_PROMPT = """Analyze potential risks and challenges for this task:

Task: {title}
Description: {description}
{context_section}

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
{{
  "overall_risk_level": "Medium",
  "risks": [
    {{
      "category": "Technical",
      "severity": "High",
      "probability": "Medium",
      "description": "Description of the risk",
      "mitigation": "How to mitigate this risk"
    }}
  ],
  "recommendations": [
    "General recommendation 1",
    "General recommendation 2"
  ]
}}

{language_instruction}"""


DEFAULT_COMMENT_GENERATION_PROMPT = """Task: {title}
Description: {description}
{context_section}

Generate an {comment_type} comment about this task.

Comment types:
- insight: Key considerations, best practices, potential improvements, hidden complexity
- risk: Top risk identification and mitigation suggestion
- progress: Progress check and next steps
- blocker: Potential blockers or dependencies
- suggestion: Improvement suggestions for specificity, measurability, achievability

Be concise (2-3 sentences), practical, and specific to this task.

{language_instruction}"""


# ============================================================================
# SMART Wizard Prompts
# ============================================================================

DEFAULT_SMART_ANALYZE_PROMPT = """You are an expert task management consultant. Analyze this task and generate clarifying questions to help the user formulate it according to SMART criteria.

TASK TO ANALYZE:
Title: {title}
Description: {description}
{context_section}

Your job is to:
1. Assess what information is missing to make this task SMART-compliant
2. Generate 3-6 targeted questions that will help clarify:
   - Specific: What exactly needs to be done? What are the deliverables?
   - Measurable: How will success be measured? What are the acceptance criteria?
   - Achievable: What approach/technology/method should be used?
   - Relevant: Why is this important? What's the business context?
   - Time-bound: What's the timeline? Are there milestones?

QUESTION TYPES:
- "radio": Single choice from options (use when there are clear alternatives)
- "checkbox": Multiple selections allowed (use for feature lists, requirements)
- "text": Free-form text input (use when options aren't predictable)

RESPONSE FORMAT:
Return ONLY valid JSON in this exact format:

{{
  "initial_assessment": "Brief assessment of the current task state and what's missing (2-3 sentences)",
  "can_skip": false,
  "questions": [
    {{
      "id": "q1",
      "type": "radio",
      "question": "Question text here?",
      "required": true,
      "options": [
        {{"value": "option1", "label": "Option 1 label", "description": "Brief explanation"}},
        {{"value": "option2", "label": "Option 2 label", "description": "Brief explanation"}},
        {{"value": "other", "label": "Другое", "description": "Укажите свой вариант"}}
      ]
    }},
    {{
      "id": "q2",
      "type": "checkbox",
      "question": "Which features should be included?",
      "required": true,
      "options": [
        {{"value": "feature1", "label": "Feature 1", "description": "Description"}},
        {{"value": "feature2", "label": "Feature 2", "description": "Description"}}
      ]
    }},
    {{
      "id": "q3",
      "type": "text",
      "question": "Free-form question?",
      "required": false
    }}
  ]
}}

IMPORTANT GUIDELINES:
- Generate 3-6 questions maximum - focus on the most important missing information
- Each question should address a specific SMART aspect
- Options should be practical and relevant to the task domain
- Include "Другое" (Other) option for radio questions when user might have a different answer
- If the task is already well-defined, set can_skip: true and provide minimal questions
- Question text and options should be in the response language

{language_instruction}"""


DEFAULT_SMART_REFINE_PROMPT = """You are an expert task management consultant. Based on the user's answers, generate a well-formulated SMART task proposal.

ORIGINAL TASK:
Title: {title}
Description: {description}
{context_section}

CLARIFYING QUESTIONS AND ANSWERS:
{qa_section}

{additional_context_section}

Your job is to generate a comprehensive SMART task proposal based on the answers provided.

RESPONSE FORMAT:
Return ONLY valid JSON in this exact format:

{{
  "title": "Clear, concise task title (5-10 words)",
  "description": "Detailed task description structured as:\n\n**Цель:**\nWhat needs to be achieved\n\n**Функциональные требования:**\n- Requirement 1\n- Requirement 2\n\n**Технические детали:**\n- Technical detail 1\n- Technical detail 2\n\n**Ограничения:**\n- Any constraints or boundaries",
  "definition_of_done": [
    "Specific, testable criterion 1",
    "Specific, testable criterion 2",
    "Specific, testable criterion 3",
    "Specific, testable criterion 4",
    "Specific, testable criterion 5"
  ],
  "time_estimate": {{
    "total_hours": 32,
    "total_days": 4,
    "breakdown": [
      {{"task": "Sub-task 1", "hours": 8}},
      {{"task": "Sub-task 2", "hours": 12}},
      {{"task": "Sub-task 3", "hours": 8}},
      {{"task": "Testing and documentation", "hours": 4}}
    ],
    "confidence": "medium"
  }},
  "smart_scores": {{
    "overall_score": 0.85,
    "is_valid": true,
    "criteria": [
      {{"name": "Specific", "score": 0.9, "explanation": "...", "suggestions": []}},
      {{"name": "Measurable", "score": 0.85, "explanation": "...", "suggestions": []}},
      {{"name": "Achievable", "score": 0.8, "explanation": "...", "suggestions": []}},
      {{"name": "Relevant", "score": 0.85, "explanation": "...", "suggestions": []}},
      {{"name": "Time-bound", "score": 0.8, "explanation": "...", "suggestions": []}}
    ],
    "summary": "Summary of the SMART analysis of the proposal",
    "recommended_changes": [],
    "acceptance_criteria": []
  }}
}}

GUIDELINES:
- Title should be clear and action-oriented (start with verb)
- Description should be comprehensive but structured
- Generate 5-9 specific, testable Definition of Done items
- Time estimate should be realistic based on the scope
- Breakdown should show logical sub-tasks
- Confidence: "high" (well-defined), "medium" (some uncertainty), "low" (significant unknowns)
- All text content should be in the response language

{language_instruction}"""


DEFAULT_PROGRESS_REVIEW_PROMPT = """Review progress for this task:

Task: {title}
Description: {description}
Current Status: {status}
{context_section}
{subtasks_section}

Provide a progress review with:
1. Overall progress assessment (on track / at risk / blocked)
2. What's going well
3. Concerns or blockers
4. Recommended next steps

Return ONLY valid JSON:
{{
  "progress_status": "on_track",
  "completion_estimate": "70%",
  "summary": "Progress summary...",
  "going_well": ["Item 1", "Item 2"],
  "concerns": ["Concern 1", "Concern 2"],
  "next_steps": ["Step 1", "Step 2", "Step 3"],
  "risk_level": "Low"
}}

{language_instruction}"""


# ============================================================================
# Language Instructions
# ============================================================================

LANGUAGE_INSTRUCTIONS = {
    "ru": "IMPORTANT: All text in your response (explanations, suggestions, criteria descriptions, etc.) MUST be in Russian language. Keep JSON keys in English but all values should be in Russian.",
    "en": "Respond in English language.",
}


def get_language_instruction(language: str = "ru") -> str:
    """Get the language instruction for AI response."""
    return LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["ru"])


# ============================================================================
# Default Prompt Access
# ============================================================================


def get_default_prompt(prompt_type) -> str:
    """
    Get the default prompt template for a given type.

    Args:
        prompt_type: PromptType enum value or string

    Returns:
        Default prompt template string
    """
    # Handle both enum and string
    type_str = prompt_type.value if hasattr(prompt_type, 'value') else str(prompt_type)

    defaults = {
        "smart_validation": DEFAULT_SMART_VALIDATION_PROMPT,
        "task_dialog": DEFAULT_TASK_DIALOG_PROMPT,
        "risk_analysis": DEFAULT_RISK_ANALYSIS_PROMPT,
        "comment_generation": DEFAULT_COMMENT_GENERATION_PROMPT,
        "progress_review": DEFAULT_PROGRESS_REVIEW_PROMPT,
        "smart_analyze": DEFAULT_SMART_ANALYZE_PROMPT,
        "smart_refine": DEFAULT_SMART_REFINE_PROMPT,
    }

    return defaults.get(type_str, "")


# ============================================================================
# Prompt Building Functions
# ============================================================================


def build_smart_validation_prompt(
    title: str, description: str, context: dict[str, Any] | None = None,
    custom_prompt: str | None = None, language: str = "ru"
) -> str:
    """
    Build SMART validation prompt with task data.

    Args:
        title: Task title
        description: Task description
        context: Optional context (priority, status, parent_task, due_date, checklists)
        custom_prompt: Optional custom prompt template from settings
        language: Response language code (ru, en)
    """
    template = custom_prompt or DEFAULT_SMART_VALIDATION_PROMPT

    # Build context section
    context_section = ""
    if context:
        if context.get("priority"):
            context_section += f"Priority: {context['priority']}\n"
        if context.get("status"):
            context_section += f"Status: {context['status']}\n"

        # Time-bound data (critical for T criterion)
        if context.get("due_date"):
            context_section += f"Due Date: {context['due_date']}\n"
        if context.get("estimated_hours"):
            context_section += f"Estimated Hours: {context['estimated_hours']}\n"

        # Parent task context
        if context.get("parent_task"):
            parent = context["parent_task"]
            context_section += f"\nParent Task Context:\n"
            context_section += f"  Title: {parent.get('title', 'N/A')}\n"
            if parent.get("description"):
                context_section += f"  Description: {parent['description']}\n"

        # Checklists / Definition of Done (critical for M criterion)
        if context.get("checklists"):
            context_section += f"\nChecklists (Definition of Done):\n"
            for checklist in context["checklists"]:
                context_section += f"  [{checklist.get('title', 'Checklist')}]\n"
                items = checklist.get("items", [])
                if items:
                    for item in items:
                        status = "✓" if item.get("is_completed") else "○"
                        context_section += f"    {status} {item.get('content', '')}\n"
                else:
                    context_section += f"    (empty)\n"

    return template.format(
        title=title,
        description=description or "No description provided",
        context_section=context_section,
        language_instruction=get_language_instruction(language),
    )


def build_task_dialog_prompt(
    task_title: str,
    task_description: str,
    conversation_history: list[dict[str, str]],
    context: dict[str, Any] | None = None,
    custom_prompt: str | None = None,
    language: str = "ru",
) -> str:
    """
    Build system prompt for task dialog.

    This is used as the system message in AI conversations.
    """
    template = custom_prompt or DEFAULT_TASK_DIALOG_PROMPT
    return template.format(language_instruction=get_language_instruction(language))


def build_risk_analysis_prompt(
    task_title: str, task_description: str, context: dict[str, Any] | None = None,
    custom_prompt: str | None = None, language: str = "ru"
) -> str:
    """
    Build risk analysis prompt with task data.
    """
    template = custom_prompt or DEFAULT_RISK_ANALYSIS_PROMPT

    # Build context section
    context_section = ""
    if context:
        if context.get("priority"):
            context_section += f"Priority: {context['priority']}\n"
        if context.get("estimated_hours"):
            context_section += f"Estimated Hours: {context['estimated_hours']}\n"

    return template.format(
        title=task_title,
        description=task_description or "No description",
        context_section=context_section,
        language_instruction=get_language_instruction(language),
    )


def build_comment_generation_prompt(
    task_title: str,
    task_description: str,
    comment_type: str,
    context: dict[str, Any] | None = None,
    custom_prompt: str | None = None,
    language: str = "ru",
) -> str:
    """
    Build comment generation prompt with task data.
    """
    template = custom_prompt or DEFAULT_COMMENT_GENERATION_PROMPT

    # Build context section
    context_section = ""
    if context:
        if context.get("status"):
            context_section += f"Status: {context['status']}\n"
        if context.get("priority"):
            context_section += f"Priority: {context['priority']}\n"
        if context.get("assignee"):
            context_section += f"Assignee: {context['assignee']}\n"

    return template.format(
        title=task_title,
        description=task_description or "No description",
        comment_type=comment_type,
        context_section=context_section,
        language_instruction=get_language_instruction(language),
    )


def build_progress_review_prompt(
    task_title: str,
    task_description: str,
    task_status: str,
    subtasks: list[dict[str, Any]] | None = None,
    context: dict[str, Any] | None = None,
    custom_prompt: str | None = None,
    language: str = "ru",
) -> str:
    """
    Build progress review prompt with task data.
    """
    template = custom_prompt or DEFAULT_PROGRESS_REVIEW_PROMPT

    # Build context section
    context_section = ""
    if context:
        if context.get("created_at"):
            context_section += f"Created: {context['created_at']}\n"
        if context.get("estimated_hours"):
            context_section += f"Estimated: {context['estimated_hours']} hours\n"

    # Build subtasks section
    subtasks_section = ""
    if subtasks:
        subtasks_section = f"\nSubtasks ({len(subtasks)} total):\n"
        for st in subtasks[:5]:
            status = st.get("status", "unknown")
            title = st.get("title", "")
            subtasks_section += f"  [{status}] {title}\n"
        if len(subtasks) > 5:
            subtasks_section += f"  ... and {len(subtasks) - 5} more\n"

    return template.format(
        title=task_title,
        description=task_description or "No description",
        status=task_status,
        context_section=context_section,
        subtasks_section=subtasks_section,
        language_instruction=get_language_instruction(language),
    )


def build_smart_analyze_prompt(
    task_title: str,
    task_description: str,
    context: dict[str, Any] | None = None,
    custom_prompt: str | None = None,
    language: str = "ru",
) -> str:
    """
    Build SMART analyze prompt for generating clarifying questions.

    Args:
        task_title: Task title
        task_description: Task description
        context: Optional context (priority, status, parent_task)
        custom_prompt: Optional custom prompt template
        language: Response language code
    """
    template = custom_prompt or DEFAULT_SMART_ANALYZE_PROMPT

    # Build context section
    context_section = ""
    if context:
        if context.get("priority"):
            context_section += f"Priority: {context['priority']}\n"
        if context.get("status"):
            context_section += f"Status: {context['status']}\n"
        if context.get("parent_task"):
            parent = context["parent_task"]
            context_section += f"\nParent Task Context:\n"
            context_section += f"  Title: {parent.get('title', 'N/A')}\n"
            if parent.get("description"):
                context_section += f"  Description: {parent['description']}\n"
        if context.get("project"):
            project = context["project"]
            context_section += f"\nProject Context:\n"
            context_section += f"  Name: {project.get('name', 'N/A')}\n"
            if project.get("description"):
                context_section += f"  Description: {project['description']}\n"

    return template.format(
        title=task_title,
        description=task_description or "No description provided",
        context_section=context_section,
        language_instruction=get_language_instruction(language),
    )


def build_smart_refine_prompt(
    task_title: str,
    task_description: str,
    questions: list[dict[str, Any]],
    answers: list[dict[str, Any]],
    context: dict[str, Any] | None = None,
    additional_context: str | None = None,
    custom_prompt: str | None = None,
    language: str = "ru",
) -> str:
    """
    Build SMART refine prompt for generating task proposal based on answers.

    Args:
        task_title: Original task title
        task_description: Original task description
        questions: List of questions asked
        answers: List of user answers
        context: Optional task context
        additional_context: Additional user-provided context
        custom_prompt: Optional custom prompt template
        language: Response language code
    """
    template = custom_prompt or DEFAULT_SMART_REFINE_PROMPT

    # Build context section
    context_section = ""
    if context:
        if context.get("priority"):
            context_section += f"Priority: {context['priority']}\n"
        if context.get("parent_task"):
            parent = context["parent_task"]
            context_section += f"\nParent Task: {parent.get('title', 'N/A')}\n"

    # Build Q&A section
    qa_section = ""
    # Create a map of question_id -> question for easy lookup
    question_map = {q["id"]: q for q in questions}

    for answer in answers:
        q_id = answer["question_id"]
        question = question_map.get(q_id, {})
        question_text = question.get("question", f"Question {q_id}")
        answer_value = answer["value"]

        # Format the answer based on question type
        if isinstance(answer_value, list):
            # Checkbox - multiple values
            answer_labels = []
            options = question.get("options", [])
            option_map = {opt["value"]: opt["label"] for opt in options}
            for val in answer_value:
                answer_labels.append(option_map.get(val, val))
            answer_text = ", ".join(answer_labels)
        else:
            # Radio or text - single value
            options = question.get("options", [])
            option_map = {opt["value"]: opt["label"] for opt in options}
            answer_text = option_map.get(answer_value, answer_value)

        qa_section += f"Q: {question_text}\nA: {answer_text}\n\n"

    # Build additional context section
    additional_context_section = ""
    if additional_context:
        additional_context_section = f"ADDITIONAL USER CONTEXT:\n{additional_context}\n"

    return template.format(
        title=task_title,
        description=task_description or "No description provided",
        context_section=context_section,
        qa_section=qa_section,
        additional_context_section=additional_context_section,
        language_instruction=get_language_instruction(language),
    )
