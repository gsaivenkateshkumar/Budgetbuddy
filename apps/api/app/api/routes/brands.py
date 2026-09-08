from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories import brand_repository
from app.schemas.brand import BrandRead

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=list[BrandRead])
def list_brands(db: Session = Depends(get_db)) -> list[BrandRead]:
    return [BrandRead.model_validate(b) for b in brand_repository.list_all(db)]
