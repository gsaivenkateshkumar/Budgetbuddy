from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import Page
from app.schemas.offer import OfferRead
from app.schemas.price_history import PriceHistoryResponse
from app.schemas.product import ProductDetail, ProductSummary
from app.services import price_service, product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=Page[ProductSummary])
def list_products(
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="Free-text search over product/brand name"),
    category: str | None = Query(None, description="Category slug"),
    brand: str | None = Query(None, description="Brand slug"),
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    sort: str = Query("relevance", pattern="^(relevance|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> Page[ProductSummary]:
    return product_service.search_products(
        db,
        q=q,
        category_slug=category,
        brand_slug=brand,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)) -> ProductDetail:
    return product_service.get_product_detail(db, slug)


@router.get("/{slug}/variants/{sku}/offers", response_model=list[OfferRead])
def get_variant_offers(slug: str, sku: str, db: Session = Depends(get_db)) -> list[OfferRead]:
    return product_service.get_variant_offers(db, slug, sku)


@router.get("/{slug}/variants/{sku}/price-history", response_model=PriceHistoryResponse)
def get_variant_price_history(
    slug: str,
    sku: str,
    retailer: str | None = Query(None, description="Retailer slug; defaults to the current best offer"),
    db: Session = Depends(get_db),
) -> PriceHistoryResponse:
    return price_service.get_variant_price_history(db, slug, sku, retailer)
