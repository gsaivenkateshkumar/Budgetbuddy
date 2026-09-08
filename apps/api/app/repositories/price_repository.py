"""Queries for "current price" — always derived from the most recent
PriceRecord per RetailerListing, never duplicated/cached elsewhere. See
docs/architecture.md."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import PriceRecord


def _latest_price_record_id_subquery():
    ranked = select(
        PriceRecord.id,
        func.row_number()
        .over(partition_by=PriceRecord.retailer_listing_id, order_by=PriceRecord.collected_at.desc())
        .label("rn"),
    ).subquery()
    return select(ranked.c.id).where(ranked.c.rn == 1)


def latest_price_records_query():
    """SELECT of PriceRecord rows containing only the most recent
    observation per RetailerListing — for bulk aggregate queries (price
    filtering/sorting across many listings)."""
    return select(PriceRecord).where(PriceRecord.id.in_(_latest_price_record_id_subquery()))


def get_latest_price_record(db: Session, retailer_listing_id: int) -> PriceRecord | None:
    return db.execute(
        select(PriceRecord)
        .where(PriceRecord.retailer_listing_id == retailer_listing_id)
        .order_by(PriceRecord.collected_at.desc())
        .limit(1)
    ).scalar_one_or_none()
