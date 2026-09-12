import pytest

from app.models import BusinessProject, User
from app.services.ai.agent import MAX_TOOL_ROUNDS, NO_PROGRESS_REPLY, run_agent_turn
from app.services.ai.base import AIProvider
from app.services.ai.types import ChatCompletion, ChatMessage, ChatRole, ToolCall


class FakeProvider(AIProvider):
    """Returns a scripted sequence of completions — one per call — so the
    agent loop can be tested without any real network access."""

    name = "fake"

    def __init__(self, completions: list[ChatCompletion]):
        self._completions = completions
        self.calls: list[list[ChatMessage]] = []

    async def complete(self, messages, tools=None) -> ChatCompletion:
        self.calls.append(messages)
        return self._completions[len(self.calls) - 1]


@pytest.fixture()
def user(db_session):
    user = User(email="founder@example.com", hashed_password="x", display_name="Founder")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def business(db_session, user):
    project = BusinessProject(
        user_id=user.id, name="Cloud Kitchen", description="A cloud kitchen for regional food.", stage="idea"
    )
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)
    return project


async def test_agent_returns_plain_text_reply_with_no_tool_calls(db_session):
    provider = FakeProvider([ChatCompletion(content="Hi! How can I help?", finish_reason="stop")])

    result = await run_agent_turn(db_session, provider, [], "hello")

    assert result.reply == "Hi! How can I help?"
    assert result.tool_calls_made == []
    assert len(provider.calls) == 1


async def test_agent_executes_business_tool_and_returns_final_reply(db_session, user, business):
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="get_business_project", arguments={})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="Your business is Cloud Kitchen, at the idea stage.", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "what's my business?", user_id=user.id)

    assert result.reply == "Your business is Cloud Kitchen, at the idea stage."
    assert result.tool_calls_made == [{"name": "get_business_project", "arguments": {}}]
    tool_messages = [m for m in provider.calls[1] if m.role == "tool"]
    assert len(tool_messages) == 1
    assert "Cloud Kitchen" in tool_messages[0].content


async def test_agent_deterministic_break_even_tool_matches_calculator(db_session):
    """The model must never compute break-even itself — it calls the tool,
    which delegates to the exact same deterministic calculator the
    /calculators API uses."""
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[
                    ToolCall(
                        id="call_1",
                        name="calculate_break_even",
                        arguments={"fixed_costs": 10000, "selling_price": 100, "variable_cost_per_unit": 50},
                    )
                ],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="You need to sell 200 units to break even.", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "what's my break-even?")

    tool_message = [m for m in provider.calls[1] if m.role == "tool"][0]
    assert "200" in tool_message.content
    assert result.reply == "You need to sell 200 units to break even."


async def test_agent_reports_no_business_without_crashing(db_session, user):
    """Signed-in user with zero businesses — the tool must surface an
    honest, structured message rather than raising through the loop."""
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="get_business_project", arguments={})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="You don't have a business yet — want to validate an idea first?", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "what's my business?", user_id=user.id)

    tool_message = [m for m in provider.calls[1] if m.role == "tool"][0]
    assert "error" in tool_message.content
    assert "no business" in tool_message.content.lower()
    assert result.reply == "You don't have a business yet — want to validate an idea first?"


async def test_agent_rejects_business_tool_for_anonymous_user(db_session, business):
    """No user_id in context (anonymous chat) — business tools must fail
    closed with an authentication message, never leak another user's data."""
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="get_business_project", arguments={"business_id": business.id})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="Please sign in to see your business.", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "what's my business?", user_id=None)

    tool_message = [m for m in provider.calls[1] if m.role == "tool"][0]
    assert "error" in tool_message.content
    assert "sign in" in tool_message.content.lower()
    assert result.reply == "Please sign in to see your business."


async def test_agent_cannot_access_another_users_business(db_session, business):
    """Ownership check inside the tool dispatcher — a different user_id
    than the business owner must be treated exactly like "not found"."""
    other = User(email="stranger@example.com", hashed_password="x")
    db_session.add(other)
    db_session.commit()
    db_session.refresh(other)

    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="get_business_project", arguments={"business_id": business.id})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="I couldn't find that business.", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "show business", user_id=other.id)

    tool_message = [m for m in provider.calls[1] if m.role == "tool"][0]
    assert "error" in tool_message.content
    assert result.reply == "I couldn't find that business."


async def test_agent_stops_after_max_rounds_without_crashing(db_session):
    always_tool_call = ChatCompletion(
        content=None,
        tool_calls=[ToolCall(id="call_x", name="get_business_project", arguments={})],
        finish_reason="tool_calls",
    )
    provider = FakeProvider([always_tool_call] * MAX_TOOL_ROUNDS)

    result = await run_agent_turn(db_session, provider, [], "what's my business?")

    assert result.reply == NO_PROGRESS_REPLY
    assert len(result.tool_calls_made) == MAX_TOOL_ROUNDS
    assert len(provider.calls) == MAX_TOOL_ROUNDS


async def test_agent_passes_full_prior_turn_context_to_provider(db_session):
    provider = FakeProvider([ChatCompletion(content="Sounds good.", finish_reason="stop")])
    history = [
        ChatMessage(role=ChatRole.USER, content="I want to start a T-shirt printing business"),
        ChatMessage(role=ChatRole.ASSISTANT, content="What's your budget?"),
    ]

    result = await run_agent_turn(db_session, provider, history, "₹80,000")

    assert result.reply == "Sounds good."
    contents = [m.content for m in provider.calls[0]]
    assert any("T-shirt" in c for c in contents)
    assert any("budget" in c for c in contents)
    assert contents[-1] == "₹80,000"
