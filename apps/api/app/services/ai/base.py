"""The AI provider interface. Every provider (none/OpenAI/Anthropic, and
any future one) implements this and nothing else in the app depends on
vendor-specific request/response shapes."""
from abc import ABC, abstractmethod

from app.services.ai.types import ChatCompletion, ChatMessage, ToolSpec


class AIProvider(ABC):
    name: str

    @abstractmethod
    async def complete(
        self, messages: list[ChatMessage], tools: list[ToolSpec] | None = None
    ) -> ChatCompletion:
        """Send a conversation (optionally with available tools) and get
        back a completion — text, a tool call, or both."""
