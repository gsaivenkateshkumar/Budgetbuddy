from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.errors import AppError
from app.services.recommendation.engine import compare as run_compare
from app.services.recommendation.types import RecommendationResult, SoftPreferenceWeights

router = APIRouter(prefix="/compare", tags=["compare"])


@router.get("", response_model=RecommendationResult)
def compare_products(
    db: Session = Depends(get_db),
    product: list[str] = Query(..., description="Product slugs to compare (2 or more)"),
    price: float = Query(0.4, ge=0.0, description="Price priority weight"),
    performance: float = Query(0.3, ge=0.0, description="Performance priority weight"),
    reviews: float = Query(0.2, ge=0.0, description="Review-quality priority weight"),
    battery: float = Query(0.1, ge=0.0, description="Battery priority weight"),
) -> RecommendationResult:
    if len(product) < 2:
        raise AppError("At least 2 products are required to compare.", code="invalid_request")

    weights = SoftPreferenceWeights(price=price, performance=performance, reviews=reviews, battery=battery)
    return run_compare(db, product, weights)
