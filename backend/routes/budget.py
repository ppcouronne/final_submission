from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter()
TRIP_ID = 1


@router.get("/", response_model=List[schemas.BudgetItemOut])
def get_budget_items(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.BudgetItem)
        .filter(models.BudgetItem.trip_id == TRIP_ID)
        .order_by(models.BudgetItem.category, models.BudgetItem.created_at)
        .all()
    )


@router.post("/", response_model=schemas.BudgetItemOut)
def create_budget_item(
    item: schemas.BudgetItemCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = models.BudgetItem(**item.model_dump(), trip_id=TRIP_ID, user_id=current_user.id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=schemas.BudgetItemOut)
def update_budget_item(
    item_id: int,
    item: schemas.BudgetItemUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = db.query(models.BudgetItem).filter(models.BudgetItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Budget item not found")
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}")
def delete_budget_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = db.query(models.BudgetItem).filter(models.BudgetItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Budget item not found")
    db.delete(db_item)
    db.commit()
    return {"ok": True}
