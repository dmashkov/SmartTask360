"""
SmartTask360 — AI Client (Anthropic Claude)
"""

import asyncio
from typing import Any

from anthropic import AsyncAnthropic

from app.core.config import settings
from app.modules.ai.prompts import build_smart_validation_prompt


class AIClient:
    """
    Wrapper for Anthropic Claude API with retry logic and error handling.

    Provides async methods for interacting with Claude API.
    """

    def __init__(self):
        """Initialize Anthropic client"""
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.default_model = settings.AI_MODEL
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds

    async def send_message(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.5,
        max_tokens: int = 4096,
        system: str | None = None,
    ) -> dict[str, Any]:
        """
        Send a message to Claude and get a response.

        Args:
            messages: List of messages [{"role": "user", "content": "..."}]
            model: Model to use (defaults to settings.AI_MODEL)
            temperature: Temperature for generation (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            system: System prompt (optional)

        Returns:
            dict with keys: content, model, stop_reason, usage

        Raises:
            AIError: If API call fails after retries
        """
        model = model or self.default_model

        for attempt in range(self.max_retries):
            try:
                # Prepare request
                request_params = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }

                if system:
                    request_params["system"] = system

                # Call API
                response = await self.client.messages.create(**request_params)

                # Extract response
                return {
                    "content": response.content[0].text,
                    "model": response.model,
                    "stop_reason": response.stop_reason,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                }

            except Exception as e:
                # Log error
                print(
                    f"AI API error (attempt {attempt + 1}/{self.max_retries}): {str(e)}"
                )

                # Retry with exponential backoff
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (2**attempt))
                else:
                    # Final attempt failed
                    raise AIError(f"AI API call failed after {self.max_retries} attempts: {str(e)}")

    async def validate_smart(
        self,
        task_title: str,
        task_description: str,
        context: dict[str, Any] | None = None,
        custom_prompt: str | None = None,
        language: str = "ru",
    ) -> dict[str, Any]:
        """
        Validate task against SMART criteria.

        Args:
            task_title: Task title
            task_description: Task description
            context: Additional context (parent task, project, etc.)
            custom_prompt: Custom prompt template (optional)
            language: Response language code (default: "ru")

        Returns:
            SMART validation result
        """
        # Build enhanced prompt with examples
        prompt = build_smart_validation_prompt(
            task_title, task_description, context, custom_prompt=custom_prompt, language=language
        )

        # Call API with low temperature for consistency
        messages = [{"role": "user", "content": prompt}]

        response = await self.send_message(
            messages=messages,
            temperature=0.3,  # Low temperature for deterministic validation
            max_tokens=3096,  # Increased for detailed explanations
        )

        # Parse response (will be implemented in service)
        return response


class AIError(Exception):
    """Custom exception for AI-related errors"""

    pass
