"""Ingest real product data from Amazon India via the Amazon Creators API
into Budget Buddy's canonical catalog.

Requires AMAZON_CREATORS_CREDENTIAL_ID, AMAZON_CREATORS_CREDENTIAL_SECRET,
and AMAZON_PARTNER_TAG to be set (via environment or apps/api/.env) — see
docs/data-sources.md for how to obtain them and what Amazon eligibility
requirements must be met first. Without them this script exits with a
clear error and makes no network calls; it never runs at application
startup either way.

Usage (from apps/api, with the venv active and migrations applied):
    python scripts/ingest_amazon.py --query "laptop" --limit 20 --category laptops
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.services.ingestion.catalog_ingestion import ingest_offers
from app.services.retailers.adapters.amazon_creators import (
    AmazonAPIError,
    AmazonCreatorsAdapter,
    AmazonCredentialsMissingError,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--query", required=True, help='Search keywords, e.g. "laptop"')
    parser.add_argument("--limit", type=int, default=20, help="Max items to fetch (Amazon caps at 10/call)")
    parser.add_argument(
        "--category",
        default="uncategorized",
        help="Budget Buddy category slug to file newly-created products under",
    )
    args = parser.parse_args()

    adapter = AmazonCreatorsAdapter()
    if not adapter.is_configured:
        print(
            "Amazon Creators API is not configured — set AMAZON_CREATORS_CREDENTIAL_ID, "
            "AMAZON_CREATORS_CREDENTIAL_SECRET, and AMAZON_PARTNER_TAG first. "
            "See docs/data-sources.md for onboarding requirements.",
            file=sys.stderr,
        )
        return 1

    try:
        offers = adapter.search(args.query, limit=args.limit)
    except AmazonCredentialsMissingError as exc:
        print(f"Amazon credentials missing: {exc}", file=sys.stderr)
        return 1
    except AmazonAPIError as exc:
        print(f"Amazon API request failed: {exc}", file=sys.stderr)
        return 1

    if not offers:
        print(f"No Amazon results for query {args.query!r}.")
        return 0

    db = SessionLocal()
    try:
        result = ingest_offers(db, offers, category_slug=args.category)
    finally:
        db.close()

    print(
        f"Ingested {result.offers_seen} offer(s): "
        f"{result.listings_created} listing(s) created, {result.listings_updated} updated, "
        f"{result.variants_created} new variant(s), {result.variants_attached} attached to existing, "
        f"{result.price_records_created} price record(s) appended."
    )
    if result.errors:
        print(f"{len(result.errors)} offer(s) failed:", file=sys.stderr)
        for error in result.errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
