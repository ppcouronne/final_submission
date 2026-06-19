from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter()
TRIP_ID = 1


@router.get("/", response_model=List[schemas.FlightOut])
def get_flights(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.FlightOption)
        .filter(models.FlightOption.trip_id == TRIP_ID)
        .order_by(models.FlightOption.created_at.desc())
        .all()
    )


@router.post("/", response_model=schemas.FlightOut)
def create_flight(
    flight: schemas.FlightCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_flight = models.FlightOption(**flight.model_dump(), trip_id=TRIP_ID, user_id=current_user.id)
    db.add(db_flight)
    db.commit()
    db.refresh(db_flight)
    return db_flight


@router.put("/{flight_id}", response_model=schemas.FlightOut)
def update_flight(
    flight_id: int,
    flight: schemas.FlightUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_flight = db.query(models.FlightOption).filter(models.FlightOption.id == flight_id).first()
    if not db_flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    for key, value in flight.model_dump(exclude_unset=True).items():
        setattr(db_flight, key, value)
    db.commit()
    db.refresh(db_flight)
    return db_flight


@router.delete("/{flight_id}")
def delete_flight(
    flight_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_flight = db.query(models.FlightOption).filter(models.FlightOption.id == flight_id).first()
    if not db_flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    db.delete(db_flight)
    db.commit()
    return {"ok": True}
