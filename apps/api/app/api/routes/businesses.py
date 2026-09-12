from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.errors import AppError
from app.models import User
from app.repositories import business_repository
from app.schemas.business import (
    BudgetItemRead,
    BudgetPut,
    BudgetRead,
    BusinessProjectCreate,
    BusinessProjectRead,
    BusinessProjectUpdate,
    BusinessTaskCreate,
    BusinessTaskRead,
    BusinessTaskUpdate,
    FinancialEntryCreate,
    FinancialEntryRead,
    FinancialSummary,
    ValidationReport,
)
from app.services import business_service
from app.services.ai.factory import get_ai_provider
from app.services.ai.types import AIProviderError

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.post("", response_model=BusinessProjectRead, status_code=status.HTTP_201_CREATED)
def create_business(
    request: BusinessProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> BusinessProjectRead:
    project = business_repository.create_business(db, user_id=current_user.id, **request.model_dump())
    return BusinessProjectRead.model_validate(project)


@router.get("", response_model=list[BusinessProjectRead])
def list_businesses(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[BusinessProjectRead]:
    projects = business_repository.list_businesses(db, user_id=current_user.id)
    return [BusinessProjectRead.model_validate(p) for p in projects]


@router.get("/{business_id}", response_model=BusinessProjectRead)
def get_business(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> BusinessProjectRead:
    project = business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    return BusinessProjectRead.model_validate(project)


@router.patch("/{business_id}", response_model=BusinessProjectRead)
def update_business(
    business_id: int,
    request: BusinessProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BusinessProjectRead:
    project = business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    updated = business_repository.update_business(
        db, project, **request.model_dump(exclude_unset=True)
    )
    return BusinessProjectRead.model_validate(updated)


@router.post("/{business_id}/validate", response_model=ValidationReport, status_code=status.HTTP_201_CREATED)
async def validate_business(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ValidationReport:
    project = business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    provider = get_ai_provider()
    try:
        validation = await business_service.run_validation(db, project=project, provider=provider)
    except AIProviderError as exc:
        raise AppError(f"Validation failed: {exc}", code="validation_failed", status_code=502) from exc
    return ValidationReport.from_model(validation)


@router.get("/{business_id}/validation", response_model=ValidationReport)
def get_latest_validation(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> ValidationReport:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    validation = business_repository.latest_validation(db, business_project_id=business_id)
    if validation is None:
        raise AppError("No validation has been run yet.", code="not_found", status_code=404)
    return ValidationReport.from_model(validation)


@router.get("/{business_id}/budget", response_model=BudgetRead)
def get_budget(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> BudgetRead:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    items = business_repository.get_budget(db, business_project_id=business_id)
    return BudgetRead(items=[BudgetItemRead.model_validate(i) for i in items], total=business_service.budget_total(items))


@router.put("/{business_id}/budget", response_model=BudgetRead)
def put_budget(
    business_id: int,
    request: BudgetPut,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BudgetRead:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    items = business_repository.replace_budget(
        db, business_project_id=business_id, items=[i.model_dump() for i in request.items]
    )
    return BudgetRead(items=[BudgetItemRead.model_validate(i) for i in items], total=business_service.budget_total(items))


@router.get("/{business_id}/tasks", response_model=list[BusinessTaskRead])
def list_tasks(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[BusinessTaskRead]:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    tasks = business_repository.list_tasks(db, business_project_id=business_id)
    return [BusinessTaskRead.model_validate(t) for t in tasks]


@router.post("/{business_id}/tasks", response_model=BusinessTaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    business_id: int,
    request: BusinessTaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BusinessTaskRead:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    task = business_repository.create_task(db, business_project_id=business_id, **request.model_dump())
    return BusinessTaskRead.model_validate(task)


@router.post("/{business_id}/tasks/generate-roadmap", response_model=list[BusinessTaskRead])
def generate_roadmap(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[BusinessTaskRead]:
    project = business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    try:
        tasks = business_service.generate_default_roadmap(db, project=project)
    except ValueError as exc:
        raise AppError(str(exc), code="roadmap_already_exists", status_code=409) from exc
    return [BusinessTaskRead.model_validate(t) for t in tasks]


@router.patch("/{business_id}/tasks/{task_id}", response_model=BusinessTaskRead)
def update_task(
    business_id: int,
    task_id: int,
    request: BusinessTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BusinessTaskRead:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    task = business_repository.get_task(db, business_project_id=business_id, task_id=task_id)
    if task is None:
        raise AppError("Task not found.", code="not_found", status_code=404)
    updated = business_repository.update_task(db, task, **request.model_dump(exclude_unset=True))
    return BusinessTaskRead.model_validate(updated)


@router.get("/{business_id}/financials", response_model=list[FinancialEntryRead])
def list_financials(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[FinancialEntryRead]:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    entries = business_repository.list_financial_entries(db, business_project_id=business_id)
    return [FinancialEntryRead.model_validate(e) for e in entries]


@router.post("/{business_id}/financials", response_model=FinancialEntryRead, status_code=status.HTTP_201_CREATED)
def create_financial_entry(
    business_id: int,
    request: FinancialEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FinancialEntryRead:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    entry = business_repository.create_financial_entry(db, business_project_id=business_id, **request.model_dump())
    return FinancialEntryRead.model_validate(entry)


@router.get("/{business_id}/financials/summary", response_model=FinancialSummary)
def financial_summary(
    business_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> FinancialSummary:
    business_service.get_owned_business(db, business_id=business_id, user_id=current_user.id)
    summary = business_repository.financial_summary(db, business_project_id=business_id)
    return FinancialSummary(**summary)
