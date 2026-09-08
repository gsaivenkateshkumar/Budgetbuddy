from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant
from app.services.ai.agent import (
    EMPTY_CATALOG_REPLY,
    MAX_EMPTY_CATALOG_SEARCHES,
    MAX_TOOL_ROUNDS,
    NO_PROGRESS_REPLY,
    run_agent_turn,
)
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
def catalog(db_session):
    brand = Brand(name="Apple", slug="apple")
    category = Category(name="Laptops", slug="laptops")
    retailer = Retailer(name="Amazon India", slug="amazon-in")
    db_session.add_all([brand, category, retailer])
    db_session.flush()

    product = Product(brand=brand, category=category, name="MacBook Air M2", slug="macbook-air-m2")
    db_session.add(product)
    db_session.flush()

    variant = Variant(product=product, sku="MBA-8-256", name="MBA 8/256", specs={"ram_gb": 8})
    db_session.add(variant)
    db_session.flush()

    listing = RetailerListing(
        variant=variant, retailer=retailer, product_url="https://amazon.example/mba", title="MBA"
    )
    db_session.add(listing)
    db_session.flush()
    db_session.add(
        PriceRecord(
            retailer_listing=listing,
            price=Decimal("94900"),
            currency="INR",
            in_stock=True,
            source="mock:amazon-in_adapter",
            collected_at=datetime.now(UTC),
        )
    )
    db_session.commit()


async def test_agent_returns_plain_text_reply_with_no_tool_calls(db_session):
    provider = FakeProvider([ChatCompletion(content="Hi! How can I help?", finish_reason="stop")])

    result = await run_agent_turn(db_session, provider, [], "hello")

    assert result.reply == "Hi! How can I help?"
    assert result.tool_calls_made == []
    assert len(provider.calls) == 1


async def test_agent_executes_tool_call_and_returns_final_reply(db_session, catalog):
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="search_products", arguments={"q": "macbook"})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="I found the MacBook Air M2 for you.", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "find me a macbook")

    assert result.reply == "I found the MacBook Air M2 for you."
    assert result.tool_calls_made == [{"name": "search_products", "arguments": {"q": "macbook"}}]
    assert len(provider.calls) == 2
    # The tool result must have reached the model on the second call.
    second_call_messages = provider.calls[1]
    tool_messages = [m for m in second_call_messages if m.role == "tool"]
    assert len(tool_messages) == 1
    assert "macbook-air-m2" in tool_messages[0].content


async def test_agent_stops_after_max_rounds_without_crashing(db_session, catalog):
    always_tool_call = ChatCompletion(
        content=None,
        tool_calls=[ToolCall(id="call_x", name="search_products", arguments={"q": "macbook"})],
        finish_reason="tool_calls",
    )
    provider = FakeProvider([always_tool_call] * MAX_TOOL_ROUNDS)

    result = await run_agent_turn(db_session, provider, [], "find me a macbook")

    assert result.reply == NO_PROGRESS_REPLY
    assert len(result.tool_calls_made) == MAX_TOOL_ROUNDS
    assert len(provider.calls) == MAX_TOOL_ROUNDS


async def test_agent_surfaces_tool_error_without_crashing(db_session):
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="get_product_details", arguments={})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="I couldn't find that product.", finish_reason="stop"),
        ]
    )

    result = await run_agent_turn(db_session, provider, [], "tell me about xyz")

    assert result.reply == "I couldn't find that product."
    tool_message = [m for m in provider.calls[1] if m.role == "tool"][0]
    assert "error" in tool_message.content


async def test_agent_passes_full_prior_turn_context_to_provider(db_session):
    """Regression test for a reported production conversation where turn 2
    ("studies") appeared to lose the turn-1 context ("laptop under
    ₹60,000"). Reproduces the exact shape the /ai/chat route builds from
    ChatRequest.history and asserts the provider actually receives both
    the prior user message and the prior assistant question — proving
    history loss was not the cause."""
    provider = FakeProvider(
        [ChatCompletion(content="Here are some laptops for studying.", finish_reason="stop")]
    )
    history = [
        ChatMessage(role=ChatRole.USER, content="Recommend a laptop under ₹60,000"),
        ChatMessage(
            role=ChatRole.ASSISTANT,
            content="Could you tell me the primary use for the laptop?",
        ),
    ]

    result = await run_agent_turn(db_session, provider, history, "studies")

    assert result.reply == "Here are some laptops for studying."
    sent_messages = provider.calls[0]
    contents = [m.content for m in sent_messages]
    assert any("₹60,000" in c for c in contents)
    assert any("primary use" in c for c in contents)
    assert contents[-1] == "studies"


async def test_agent_preserves_original_history_across_tool_rounds(db_session, catalog):
    """Tool calls append to the conversation — they must never replace or
    drop the turns that came before them."""
    provider = FakeProvider(
        [
            ChatCompletion(
                content=None,
                tool_calls=[ToolCall(id="call_1", name="search_products", arguments={"q": "macbook"})],
                finish_reason="tool_calls",
            ),
            ChatCompletion(content="Found it.", finish_reason="stop"),
        ]
    )
    history = [ChatMessage(role=ChatRole.USER, content="Recommend a laptop under ₹60,000")]

    await run_agent_turn(db_session, provider, history, "studies")

    # The second call to the provider (after the tool round) must still
    # carry the original turn-1 message alongside the new tool exchange.
    second_call_contents = [m.content for m in provider.calls[1]]
    assert any("₹60,000" in c for c in second_call_contents)


async def test_agent_stops_early_and_reports_empty_catalog_instead_of_looping(db_session):
    """No catalog data seeded — every search_products call returns
    total: 0. The agent must stop after MAX_EMPTY_CATALOG_SEARCHES and
    say so honestly, rather than burning all MAX_TOOL_ROUNDS on repeat
    searches and falling back to the generic, catalog-blind
    NO_PROGRESS_REPLY."""
    always_search = ChatCompletion(
        content=None,
        tool_calls=[ToolCall(id="call_x", name="search_products", arguments={"category": "laptops"})],
        finish_reason="tool_calls",
    )
    provider = FakeProvider([always_search] * MAX_TOOL_ROUNDS)

    result = await run_agent_turn(db_session, provider, [], "recommend a laptop under 60000 for studies")

    assert result.reply == EMPTY_CATALOG_REPLY
    assert result.reply != NO_PROGRESS_REPLY
    # Stopped early — never fabricated a recommendation from empty results,
    # and didn't burn every round on searches that were never going to work.
    assert len(provider.calls) == MAX_EMPTY_CATALOG_SEARCHES
    assert len(provider.calls) < MAX_TOOL_ROUNDS
