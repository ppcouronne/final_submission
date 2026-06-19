from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TripOut(BaseModel):
    id: int
    name: str
    origin: str
    destination: str
    start_date: str
    end_date: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class FlightCreate(BaseModel):
    airline: str
    outbound_departure: Optional[str] = None
    outbound_arrival: Optional[str] = None
    return_departure: Optional[str] = None
    return_arrival: Optional[str] = None
    price: Optional[float] = None
    currency: str = "CAD"
    stops_outbound: int = 0
    stops_return: int = 0
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "researching"


class FlightUpdate(BaseModel):
    airline: Optional[str] = None
    outbound_departure: Optional[str] = None
    outbound_arrival: Optional[str] = None
    return_departure: Optional[str] = None
    return_arrival: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    stops_outbound: Optional[int] = None
    stops_return: Optional[int] = None
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class FlightOut(BaseModel):
    id: int
    trip_id: int
    user_id: int
    airline: str
    outbound_departure: Optional[str] = None
    outbound_arrival: Optional[str] = None
    return_departure: Optional[str] = None
    return_arrival: Optional[str] = None
    price: Optional[float] = None
    currency: str
    stops_outbound: int
    stops_return: int
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AccommodationCreate(BaseModel):
    name: str
    accommodation_type: Optional[str] = None
    location: Optional[str] = None
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    price_per_night: Optional[float] = None
    total_price: Optional[float] = None
    currency: str = "CAD"
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[float] = None
    status: str = "researching"


class AccommodationUpdate(BaseModel):
    name: Optional[str] = None
    accommodation_type: Optional[str] = None
    location: Optional[str] = None
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    price_per_night: Optional[float] = None
    total_price: Optional[float] = None
    currency: Optional[str] = None
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[float] = None
    status: Optional[str] = None


class AccommodationOut(BaseModel):
    id: int
    trip_id: int
    user_id: int
    name: str
    accommodation_type: Optional[str] = None
    location: Optional[str] = None
    checkin_date: Optional[str] = None
    checkout_date: Optional[str] = None
    price_per_night: Optional[float] = None
    total_price: Optional[float] = None
    currency: str
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    rating: Optional[float] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    price_per_person: Optional[float] = None
    currency: str = "USD"
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "interested"


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    price_per_person: Optional[float] = None
    currency: Optional[str] = None
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ActivityOut(BaseModel):
    id: int
    trip_id: int
    user_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    price_per_person: Optional[float] = None
    currency: str
    booking_url: Optional[str] = None
    notes: Optional[str] = None
    status: str
    is_suggestion: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    category: str = "general"


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


class NoteOut(BaseModel):
    id: int
    trip_id: int
    user_id: int
    title: str
    content: Optional[str] = None
    category: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetItemCreate(BaseModel):
    category: str
    name: str
    estimated_amount: float = 0
    actual_amount: Optional[float] = None
    currency: str = "CAD"
    notes: Optional[str] = None


class BudgetItemUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    estimated_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None


class BudgetItemOut(BaseModel):
    id: int
    trip_id: int
    user_id: int
    category: str
    name: str
    estimated_amount: float
    actual_amount: Optional[float] = None
    currency: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: int
    trip_id: int
    user_id: Optional[int] = None
    sender_name: Optional[str] = None
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
