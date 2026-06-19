from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter()
TRIP_ID = 1


@router.get("/", response_model=List[schemas.ActivityOut])
def get_activities(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Activity)
        .filter(models.Activity.trip_id == TRIP_ID)
        .order_by(models.Activity.is_suggestion.desc(), models.Activity.created_at.asc())
        .all()
    )


@router.post("/", response_model=schemas.ActivityOut)
def create_activity(
    activity: schemas.ActivityCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = models.Activity(
        **activity.model_dump(), trip_id=TRIP_ID, user_id=current_user.id, is_suggestion=False
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=schemas.ActivityOut)
def update_activity(
    item_id: int,
    activity: schemas.ActivityUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = db.query(models.Activity).filter(models.Activity.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Activity not found")
    for key, value in activity.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}")
def delete_activity(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = db.query(models.Activity).filter(models.Activity.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(db_item)
    db.commit()
    return {"ok": True}
