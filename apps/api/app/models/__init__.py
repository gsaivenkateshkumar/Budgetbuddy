"""Import all models so Base.metadata is fully populated for Alembic
autogenerate and for application startup."""
from app.models.brand import Brand
from app.models.category import Category
from app.models.image import Image
from app.models.price_record import PriceRecord
from app.models.product import Product
from app.models.retailer import Retailer
from app.models.retailer_listing import RetailerListing
from app.models.review_summary import ReviewSummary
from app.models.variant import Variant

__all__ = [
    "Brand",
    "Category",
    "Product",
    "Variant",
    "Image",
    "Retailer",
    "RetailerListing",
    "PriceRecord",
    "ReviewSummary",
]
