"""Idea validation engine.

Architecture (see product brief): ValidationInput -> deterministic
feasibility scoring -> optional Groq structured narrative -> ValidationReport.

The score, verdict, and confidence are ALWAYS computed by plain Python from
the structured input below — never by the LLM. The LLM (when configured)
only writes the narrative sections, grounded in the already-computed score
so it can't contradict it, and its output is parsed as strict JSON and
validated against ValidationReportSections before being trusted at all. If
that fails for any reason (no provider configured, malformed JSON, a
network error), a deterministic fallback narrative is used instead — the
score and verdict are identical either way.
"""
import json
import re
from dataclasses import dataclass
from decimal import Decimal

from pydantic import ValidationError

from app.schemas.business import ValidationReportSections, ValidationScores
from app.services.ai.base import AIProvider
from app.services.ai.types import AIProviderError, ChatMessage, ChatRole

# Rough minimum capital, by delivery mode, to fund a first launch without
# immediate cash-flow strain — a deliberately simple planning heuristic
# (not a market survey), documented here so it can be tuned later.
_CAPITAL_BENCHMARK_INR = {"online": Decimal("20000"), "hybrid": Decimal("50000"), "offline": Decimal("100000")}
_DEFAULT_CAPITAL_BENCHMARK = Decimal("60000")

_FULL_TIME_MARKERS = {"full-time", "full time", "fulltime"}
_PART_TIME_MARKERS = {"part-time", "part time", "parttime", "side project", "weekends"}


@dataclass
class ValidationInput:
    idea: str
    description: str
    industry: str | None
    location: str | None
    startup_budget: Decimal | None
    experience_level: str | None
    target_customer: str | None
    delivery_mode: str | None
    time_commitment: str | None
    goals: str | None


def _clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def _score_demand(inp: ValidationInput) -> int:
    score = 0
    if inp.target_customer and len(inp.target_customer.strip()) >= 15:
        score += 10
    if inp.description and len(inp.description.strip()) >= 60:
        score += 10
    return _clamp(score, 0, 20)


def _score_differentiation(inp: ValidationInput) -> int:
    score = 0
    if inp.description and len(inp.description.strip()) >= 120:
        score += 8
    if inp.goals and len(inp.goals.strip()) >= 15:
        score += 7
    return _clamp(score, 0, 15)


def _score_business_model(inp: ValidationInput) -> int:
    score = 0
    if inp.delivery_mode:
        score += 5
    if inp.description and len(inp.description.strip()) >= 80:
        score += 10
    return _clamp(score, 0, 15)


def _score_capital(inp: ValidationInput) -> int:
    if inp.startup_budget is None or inp.startup_budget <= 0:
        return 0
    benchmark = _CAPITAL_BENCHMARK_INR.get((inp.delivery_mode or "").lower(), _DEFAULT_CAPITAL_BENCHMARK)
    ratio = inp.startup_budget / benchmark
    return _clamp(int(min(ratio, Decimal("1")) * 20), 0, 20)


def _score_operational(inp: ValidationInput) -> int:
    score = 0
    commitment = (inp.time_commitment or "").strip().lower()
    if commitment in _FULL_TIME_MARKERS:
        score += 8
    elif commitment in _PART_TIME_MARKERS or commitment:
        score += 4
    if inp.experience_level and inp.experience_level.strip():
        score += 7
    return _clamp(score, 0, 15)


def _score_gtm(inp: ValidationInput) -> int:
    score = 0
    if inp.target_customer:
        score += 6
    if inp.delivery_mode:
        score += 5
    if inp.location:
        score += 4
    return _clamp(score, 0, 15)


def score_idea(inp: ValidationInput) -> ValidationScores:
    demand = _score_demand(inp)
    differentiation = _score_differentiation(inp)
    business_model = _score_business_model(inp)
    capital = _score_capital(inp)
    operational = _score_operational(inp)
    gtm = _score_gtm(inp)
    total = demand + differentiation + business_model + capital + operational + gtm
    return ValidationScores(
        demand=demand,
        differentiation=differentiation,
        business_model=business_model,
        capital=capital,
        operational=operational,
        gtm=gtm,
        total=total,
    )


def missing_info(inp: ValidationInput) -> list[str]:
    missing = []
    if not inp.startup_budget or inp.startup_budget <= 0:
        missing.append("No startup budget provided — capital feasibility can't be assessed.")
    if not inp.target_customer or len(inp.target_customer.strip()) < 15:
        missing.append("Target customer isn't described in enough detail yet.")
    if not inp.description or len(inp.description.strip()) < 60:
        missing.append("The business description is too brief to assess demand or differentiation.")
    if not inp.delivery_mode:
        missing.append("Online/offline/hybrid delivery mode not specified.")
    if not inp.location:
        missing.append("Target location/market not specified.")
    return missing


def confidence_for(scores: ValidationScores, missing: list[str]) -> str:
    if len(missing) >= 3:
        return "Low"
    if len(missing) == 0 and scores.total >= 60:
        return "High"
    return "Medium"


def verdict_for(scores: ValidationScores) -> str:
    non_capital_total = scores.total - scores.capital
    if scores.capital <= 5 and non_capital_total >= 40:
        return "Capital mismatch — budget looks insufficient for this type of business"
    if scores.total >= 75:
        return "Promising — worth pursuing further validation"
    if scores.total >= 55:
        return "Needs more validation"
    if scores.total >= 35:
        return "High execution risk"
    return "Needs significant rework before launch"


_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _extract_json(text: str) -> dict:
    cleaned = _JSON_FENCE_RE.sub("", text).strip()
    return json.loads(cleaned)


def _fallback_sections(inp: ValidationInput, scores: ValidationScores, missing: list[str]) -> ValidationReportSections:
    """Used whenever the LLM is unavailable or returns something that
    doesn't validate — a plain, honest restatement of the structured
    input, never a fabricated business fact."""
    return ValidationReportSections(
        business_summary=f"{inp.idea.strip()}. {inp.description.strip()}"[:1000],
        target_customer=inp.target_customer or "Not described yet — add who this is for to improve this report.",
        problem_being_solved="Not enough detail was provided to state the problem being solved precisely.",
        revenue_model="Not specified — add how this business charges customers for a fuller assessment.",
        startup_requirements=(
            f"Stated startup budget: ₹{inp.startup_budget}." if inp.startup_budget else "No startup budget provided."
        ),
        estimated_cost_areas=[],
        operational_complexity="Needs validation — not enough information to assess day-to-day operational load.",
        competition_considerations="Needs validation — no competitive research captured yet.",
        differentiation_opportunities="Needs validation — describe what makes this different from existing options.",
        major_risks=missing or ["No major structural gaps detected in the information provided."],
        questions_to_validate=[
            "Have you talked to potential customers about this problem?",
            "What would make someone choose this over an existing alternative?",
        ],
        recommended_next_actions=[
            "Fill in the missing details above for a sharper validation report.",
            "Talk to 5-10 potential customers before spending on setup.",
        ],
    )


_SYSTEM_PROMPT = """You are the analysis engine behind Start Currency's idea validator. You will be given \
a business idea's structured details and a deterministic feasibility score that has ALREADY been \
computed — you must not recompute or contradict that score.

Respond with ONLY a single JSON object (no markdown fences, no commentary) with exactly these string/array \
keys: business_summary, target_customer, problem_being_solved, revenue_model, startup_requirements, \
estimated_cost_areas (array of short strings), operational_complexity, competition_considerations, \
differentiation_opportunities, major_risks (array of short strings), questions_to_validate (array of short \
strings), recommended_next_actions (array of short strings).

Rules:
1. Never claim the idea will succeed, or promise profit, demand, or ROI. Use measured language: promising, \
needs validation, execution risk, capital mismatch, etc.
2. Where information is insufficient, say so plainly rather than inventing specifics.
3. Keep each field concise (1-3 sentences, or 2-5 short list items).
4. This is planning software, not financial, legal, tax, or investment advice — do not present it as such.
"""


async def generate_report_sections(
    provider: AIProvider, inp: ValidationInput, scores: ValidationScores, verdict: str, missing: list[str]
) -> ValidationReportSections:
    if provider.name == "none":
        return _fallback_sections(inp, scores, missing)

    user_payload = {
        "idea": inp.idea,
        "description": inp.description,
        "industry": inp.industry,
        "location": inp.location,
        "startup_budget_inr": str(inp.startup_budget) if inp.startup_budget is not None else None,
        "experience_level": inp.experience_level,
        "target_customer": inp.target_customer,
        "delivery_mode": inp.delivery_mode,
        "time_commitment": inp.time_commitment,
        "goals": inp.goals,
        "computed_score": scores.model_dump(),
        "computed_verdict": verdict,
        "missing_information": missing,
    }

    messages = [
        ChatMessage(role=ChatRole.SYSTEM, content=_SYSTEM_PROMPT),
        ChatMessage(role=ChatRole.USER, content=json.dumps(user_payload)),
    ]

    try:
        completion = await provider.complete(messages, tools=None)
        parsed = _extract_json(completion.content or "")
        return ValidationReportSections(**parsed)
    except (AIProviderError, json.JSONDecodeError, ValidationError, TypeError):
        return _fallback_sections(inp, scores, missing)
