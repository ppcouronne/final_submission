from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter()
TRIP_ID = 1


@router.get("/", response_model=List[schemas.AccommodationOut])
def get_accommodations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.AccommodationOption)
        .filter(models.AccommodationOption.trip_id == TRIP_ID)
        .order_by(models.AccommodationOption.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.AccommodationOut)
def create_accommodation(
    accommodation: schemas.AccommodationCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = models.AccommodationOption(
        **accommodation.model_dump(), trip_id=TRIP_ID, user_id=current_user.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=schemas.AccommodationOut)
def update_accommodation(
    item_id: int,
    accommodation: schemas.AccommodationUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = db.query(models.AccommodationOption).filter(models.AccommodationOption.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Accommodation not found")
    for key, value in accommodation.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/{item_id}")
def delete_accommodation(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_item = db.query(models.AccommodationOption).filter(models.AccommodationOption.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Accommodation not found")
    db.delete(db_item)
    db.commit()
    return {"ok": True}
