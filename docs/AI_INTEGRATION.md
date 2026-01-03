# SmartTask360 — AI Integration Guide

## Overview

SmartTask360 uses Claude AI (Anthropic) for three main capabilities:

1. **SMART Validation** — Analyze task formulation against SMART criteria
2. **Interactive Dialogs** — Help users refine task definitions
3. **AI Comments** — Generate expert analysis on demand

## SMART Validation

### Criteria

| Criterion | Description | Key Questions |
|-----------|-------------|---------------|
| **S**pecific | Clear and concrete | What exactly? What result? Who? |
| **M**easurable | Quantifiable | How much? How to measure? |
| **A**chievable | Realistic | Resources available? Skills? |
| **R**elevant | Aligned with goals | Why important? Business value? |
| **T**ime-bound | Has deadline | When? Milestones? |

### Scoring

- Each criterion: 0.0 to 1.0
- Criterion passes if score >= 0.7
- Task is valid if overall_score >= 0.7 AND all criteria pass

### Response Format

```json
{
  "is_valid": false,
  "overall_score": 0.38,
  "criteria": {
    "specific": {
      "score": 0.3,
      "passed": false,
      "issue": "Не указано, какие действия нужно предпринять",
      "suggestion": "Уточните конкретные меры и ожидаемый результат"
    },
    "measurable": { ... },
    "achievable": { ... },
    "relevant": { ... },
    "time_bound": { ... }
  },
  "improved_title": "Улучшенный заголовок",
  "improved_description": "Улучшенное описание",
  "questions": ["Вопрос 1?", "Вопрос 2?"]
}
```

## Interactive Dialogs

### Flow

1. User creates task with low SMART score
2. User clicks "Discuss with AI"
3. AI asks clarifying questions one by one
4. User provides answers
5. AI refines suggestions
6. User applies final version

### Dialog Types

- `smart_validation` — Refine task formulation
- `discussion` — General task discussion
- `decomposition` — Break down into subtasks

## AI Comments

### Types

| Type | Purpose | Output |
|------|---------|--------|
| `risk_analysis` | Identify risks | List of risks with probability, impact, mitigation |
| `decomposition` | Suggest subtasks | List of subtasks with estimates, dependencies |
| `progress_review` | Evaluate progress | Status assessment, completion probability, recommendations |
| `general` | General analysis | Overall task assessment |

## Configuration

```python
AIConfig:
  model: "claude-sonnet-4-20250514"
  max_tokens: 4096
  temperature_validation: 0.3  # Deterministic
  temperature_dialog: 0.7      # Creative
  temperature_comments: 0.5    # Balanced
  max_retries: 3
```

## Error Handling

### Exception Types

- `AIConnectionError` — Failed to connect
- `AIRateLimitError` — Rate limit exceeded
- `AIResponseParseError` — Failed to parse JSON
- `AIContextTooLongError` — Context too large

### Fallback Strategy

AI calls always have fallback — if AI fails, user can proceed without validation.

## File Structure

```
app/modules/ai/
├── __init__.py
├── models.py           # AIConversation
├── schemas.py          # Request/Response schemas
├── service.py          # AIService
├── router.py           # API endpoints
├── client.py           # Anthropic wrapper
├── config.py           # AI configuration
├── exceptions.py       # AI exceptions
├── monitoring.py       # Request logging
└── prompts/
    ├── __init__.py
    ├── base.py
    ├── smart_validation.py
    ├── task_dialog.py
    ├── risk_analysis.py
    ├── decomposition.py
    └── progress_review.py
```

## Best Practices

1. **Context Quality** — Include document text, project goals, assignee info
2. **Error Handling** — Always have fallback for AI failures
3. **User Control** — Never block workflows on AI errors
4. **Monitoring** — Log tokens, latency, success/error rates
