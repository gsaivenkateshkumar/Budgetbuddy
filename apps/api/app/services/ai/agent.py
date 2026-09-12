"""The Ask Start Currency agentic loop: sends the conversation to the
configured provider, executes any tool calls against real backend data
(the user's own business project, budget, tasks, and financials), and
repeats until the provider answers in plain text or a round limit is hit.
Runs entirely server-side within one request — the frontend only ever
sees the final reply and, for transparency, which tools were used.
"""
import json
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from app.services.ai.base import AIProvider
from app.services.ai.business_tools import BUSINESS_TOOLS, dispatch_business_tool
from app.services.ai.types import ChatMessage, ChatRole

SYSTEM_PROMPT = """You are Ask Start Currency, the AI business copilot for Start Currency — a platform \
that helps people validate a business idea, plan its launch, budget it, and manage it operationally, \
under the positioning "Turn your idea into a business."

Rules you must always follow:

1. You may only state facts about the user's business (name, stage, budget, tasks, revenue, expenses) \
that come from a tool result in this conversation. Never invent numbers, tasks, or transactions.
2. Any arithmetic (break-even, margin, totals) MUST come from calculate_break_even, calculate_margin, or \
another tool result — never compute or restate a number yourself without one. If you need a number, call \
the tool.
3. Use get_business_project, get_business_budget, get_financial_summary, and get_launch_tasks whenever you \
need the user's real business context instead of asking them to repeat it.
4. If the user has no business project yet (a tool reports this), suggest they validate their idea or \
create a business — don't fabricate one.
5. Never promise guaranteed profit, success, ROI, or demand. Use measured language: promising, needs more \
validation, execution risk, capital mismatch, etc. This is planning software, not financial, legal, tax, \
or investment advice.
6. When you give a financial projection or scenario, state the assumptions behind it plainly.
7. Keep responses concise and focused on helping the user make progress on their business.
"""

MAX_TOOL_ROUNDS = 4
NO_PROGRESS_REPLY = "I wasn't able to finish that in time — could you narrow your question a bit?"


@dataclass
class AgentTurnResult:
    reply: str
    tool_calls_made: list[dict] = field(default_factory=list)


async def run_agent_turn(
    db: Session,
    provider: AIProvider,
    history: list[ChatMessage],
    user_message: str,
    *,
    user_id: int | None = None,
    default_business_id: int | None = None,
) -> AgentTurnResult:
    messages: list[ChatMessage] = [
        ChatMessage(role=ChatRole.SYSTEM, content=SYSTEM_PROMPT),
        *history,
        ChatMessage(role=ChatRole.USER, content=user_message),
    ]
    tool_calls_made: list[dict] = []

    for _ in range(MAX_TOOL_ROUNDS):
        completion = await provider.complete(messages, tools=BUSINESS_TOOLS)

        if not completion.tool_calls:
            return AgentTurnResult(reply=completion.content or "", tool_calls_made=tool_calls_made)

        messages.append(
            ChatMessage(
                role=ChatRole.ASSISTANT, content=completion.content or "", tool_calls=completion.tool_calls
            )
        )

        for call in completion.tool_calls:
            try:
                result = dispatch_business_tool(
                    db, call.name, call.arguments, user_id=user_id, default_business_id=default_business_id
                )
                result_text = json.dumps(result)
            except Exception as exc:  # noqa: BLE001 - surfaced to the model, not a crash
                result_text = json.dumps({"error": str(exc)})

            tool_calls_made.append({"name": call.name, "arguments": call.arguments})
            messages.append(
                ChatMessage(role=ChatRole.TOOL, content=result_text, tool_call_id=call.id, name=call.name)
            )

    return AgentTurnResult(reply=NO_PROGRESS_REPLY, tool_calls_made=tool_calls_made)
