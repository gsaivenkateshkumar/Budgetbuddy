"""Queries for the Start Currency business domain. Every function that
takes a `business_project_id` also takes `user_id` and filters on it —
there is no query in this module that can return another user's data by
ID alone (see app/services/business_service.py for the 404-on-mismatch
enforcement used by every route)."""
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import BudgetItem, BusinessProject, BusinessTask, FinancialEntry, IdeaValidation


def create_business(db: Session, *, user_id: int, **fields) -> BusinessProject:
    project = BusinessProject(user_id=user_id, **fields)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_businesses(db: Session, *, user_id: int) -> list[BusinessProject]:
    stmt = select(BusinessProject).where(BusinessProject.user_id == user_id).order_by(BusinessProject.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def get_business(db: Session, *, business_id: int, user_id: int) -> BusinessProject | None:
    stmt = select(BusinessProject).where(BusinessProject.id == business_id, BusinessProject.user_id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def update_business(db: Session, project: BusinessProject, **fields) -> BusinessProject:
    for key, value in fields.items():
        if value is not None:
            setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def add_validation(db: Session, *, business_project_id: int, **fields) -> IdeaValidation:
    validation = IdeaValidation(business_project_id=business_project_id, **fields)
    db.add(validation)
    db.commit()
    db.refresh(validation)
    return validation


def latest_validation(db: Session, *, business_project_id: int) -> IdeaValidation | None:
    stmt = (
        select(IdeaValidation)
        .where(IdeaValidation.business_project_id == business_project_id)
        .order_by(IdeaValidation.created_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def replace_budget(db: Session, *, business_project_id: int, items: list[dict]) -> list[BudgetItem]:
    db.query(BudgetItem).filter(BudgetItem.business_project_id == business_project_id).delete()
    created = [BudgetItem(business_project_id=business_project_id, **item) for item in items]
    db.add_all(created)
    db.commit()
    for item in created:
        db.refresh(item)
    return created


def get_budget(db: Session, *, business_project_id: int) -> list[BudgetItem]:
    stmt = select(BudgetItem).where(BudgetItem.business_project_id == business_project_id)
    return list(db.execute(stmt).scalars().all())


def create_task(db: Session, *, business_project_id: int, **fields) -> BusinessTask:
    task = BusinessTask(business_project_id=business_project_id, **fields)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def create_tasks_bulk(db: Session, *, business_project_id: int, tasks: list[dict]) -> list[BusinessTask]:
    created = [BusinessTask(business_project_id=business_project_id, **task) for task in tasks]
    db.add_all(created)
    db.commit()
    for task in created:
        db.refresh(task)
    return created


def list_tasks(db: Session, *, business_project_id: int) -> list[BusinessTask]:
    stmt = (
        select(BusinessTask)
        .where(BusinessTask.business_project_id == business_project_id)
        .order_by(BusinessTask.week.asc().nulls_last(), BusinessTask.order_index.asc())
    )
    return list(db.execute(stmt).scalars().all())


def get_task(db: Session, *, business_project_id: int, task_id: int) -> BusinessTask | None:
    stmt = select(BusinessTask).where(
        BusinessTask.id == task_id, BusinessTask.business_project_id == business_project_id
    )
    return db.execute(stmt).scalar_one_or_none()


def update_task(db: Session, task: BusinessTask, **fields) -> BusinessTask:
    for key, value in fields.items():
        if value is not None:
            setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def create_financial_entry(db: Session, *, business_project_id: int, **fields) -> FinancialEntry:
    entry = FinancialEntry(business_project_id=business_project_id, **fields)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_financial_entries(db: Session, *, business_project_id: int) -> list[FinancialEntry]:
    stmt = (
        select(FinancialEntry)
        .where(FinancialEntry.business_project_id == business_project_id)
        .order_by(FinancialEntry.entry_date.desc())
    )
    return list(db.execute(stmt).scalars().all())


def financial_summary(db: Session, *, business_project_id: int) -> dict:
    revenue_stmt = select(func.coalesce(func.sum(FinancialEntry.amount), 0)).where(
        FinancialEntry.business_project_id == business_project_id, FinancialEntry.type == "revenue"
    )
    expense_stmt = select(func.coalesce(func.sum(FinancialEntry.amount), 0)).where(
        FinancialEntry.business_project_id == business_project_id, FinancialEntry.type == "expense"
    )
    breakdown_stmt = (
        select(FinancialEntry.category, func.sum(FinancialEntry.amount))
        .where(FinancialEntry.business_project_id == business_project_id, FinancialEntry.type == "expense")
        .group_by(FinancialEntry.category)
    )
    count_stmt = select(func.count()).select_from(FinancialEntry).where(
        FinancialEntry.business_project_id == business_project_id
    )

    total_revenue = db.execute(revenue_stmt).scalar_one()
    total_expenses = db.execute(expense_stmt).scalar_one()
    breakdown = db.execute(breakdown_stmt).all()
    entry_count = db.execute(count_stmt).scalar_one()

    return {
        "total_revenue": Decimal(total_revenue),
        "total_expenses": Decimal(total_expenses),
        "net_result": Decimal(total_revenue) - Decimal(total_expenses),
        "expense_breakdown": [
            {"category": category or "Uncategorized", "total": Decimal(total)} for category, total in breakdown
        ],
        "entry_count": entry_count,
    }
