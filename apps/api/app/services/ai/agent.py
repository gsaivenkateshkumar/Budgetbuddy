"""The Ask Budget Buddy agentic loop: sends the conversation to the
configured provider, executes any tool calls against real backend data,
and repeats until the provider answers in plain text or a round limit is
hit. Runs entirely server-side within one request — the frontend only
ever sees the final reply and, for transparency, which tools were used.
"""
import json
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.services.ai.base import AIProvider
from app.services.ai.tools import ALL_TOOLS, dispatch_tool
from app.services.ai.types import ChatMessage, ChatRole

SYSTEM_PROMPT = """You are Ask Budget Buddy, the shopping assistant for Budget Buddy — \
an AI-powered shopping intelligence platform for the Indian market (INR).

Your job is to help the user make a better purchasing decision, not just find the \
cheapest option. Rules you must always follow:

1. You may only state commerce facts (products, prices, specs, availability, ratings, \
retailers) that come from a tool result in this conversation. Never invent a product, \
price, spec, review, or retailer.
2. Use the search_products, get_product_details, compare_products, and get_prices \
tools whenever you need real data — don't guess.
3. If critical information is missing to help the user (e.g. budget, category), ask \
one focused clarifying question before searching. Don't ask about details that \
wouldn't change your answer.
4. When you compare or recommend products, explain why using the evidence from tool \
results (price, specs, reviews) — never a bare opinion.
5. If you're not sure about something, say so plainly rather than guessing.
6. Keep responses concise and focused on helping the user decide.
"""

MAX_TOOL_ROUNDS = 4
NO_PROGRESS_REPLY = "I wasn't able to finish researching that in time — could you narrow your question a bit?"


@dataclass
class AgentTurnResult:
    reply: str
    tool_calls_made: list[dict] = field(default_factory=list)


async def run_agent_turn(
    db: Session, provider: AIProvider, history: list[ChatMessage], user_message: str
) -> AgentTurnResult:
    messages: list[ChatMessage] = [
        ChatMessage(role=ChatRole.SYSTEM, content=SYSTEM_PROMPT),
        *history,
        ChatMessage(role=ChatRole.USER, content=user_message),
    ]
    tool_calls_made: list[dict] = []

    for _ in range(MAX_TOOL_ROUNDS):
        completion = await provider.complete(messages, tools=ALL_TOOLS)

        if not completion.tool_calls:
            return AgentTurnResult(reply=completion.content or "", tool_calls_made=tool_calls_made)

        messages.append(
            ChatMessage(
                role=ChatRole.ASSISTANT, content=completion.content or "", tool_calls=completion.tool_calls
            )
        )

        for call in completion.tool_calls:
            try:
                result_text = json.dumps(dispatch_tool(db, call.name, call.arguments))
            except Exception as exc:  # noqa: BLE001 - surfaced to the model, not a crash
                result_text = json.dumps({"error": str(exc)})

            tool_calls_made.append({"name": call.name, "arguments": call.arguments})
            messages.append(
                ChatMessage(role=ChatRole.TOOL, content=result_text, tool_call_id=call.id, name=call.name)
            )

    return AgentTurnResult(reply=NO_PROGRESS_REPLY, tool_calls_made=tool_calls_made)
