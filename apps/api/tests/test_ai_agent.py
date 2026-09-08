from datetime import UTC, datetime
from decimal import Decimal

import pytest

from app.models import Brand, Category, PriceRecord, Product, Retailer, RetailerListing, Variant
from app.services.ai.agent import MAX_TOOL_ROUNDS, NO_PROGRESS_REPLY, run_agent_turn
from app.services.ai.base import AIProvider
from app.services.ai.types import ChatCompletion, ChatMessage, ToolCall


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
