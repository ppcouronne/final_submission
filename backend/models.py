from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    flights = relationship("FlightOption", back_populates="user")
    accommodations = relationship("AccommodationOption", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    notes = relationship("Note", back_populates="user")
    budget_items = relationship("BudgetItem", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user")


class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    description = Column(Text)

    flights = relationship("FlightOption", back_populates="trip")
    accommodations = relationship("AccommodationOption", back_populates="trip")
    activities = relationship("Activity", back_populates="trip")
    notes = relationship("Note", back_populates="trip")
    budget_items = relationship("BudgetItem", back_populates="trip")
    chat_messages = relationship("ChatMessage", back_populates="trip")


class FlightOption(Base):
    __tablename__ = "flight_options"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    airline = Column(String, nullable=False)
    outbound_departure = Column(String)
    outbound_arrival = Column(String)
    return_departure = Column(String)
    return_arrival = Column(String)
    price = Column(Float)
    currency = Column(String, default="CAD")
    stops_outbound = Column(Integer, default=0)
    stops_return = Column(Integer, default=0)
    booking_url = Column(String)
    notes = Column(Text)
    status = Column(String, default="researching")
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="flights")
    user = relationship("User", back_populates="flights")


class AccommodationOption(Base):
    __tablename__ = "accommodation_options"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    accommodation_type = Column(String)
    location = Column(String)
    checkin_date = Column(String)
    checkout_date = Column(String)
    price_per_night = Column(Float)
    total_price = Column(Float)
    currency = Column(String, default="CAD")
    booking_url = Column(String)
    notes = Column(Text)
    rating = Column(Float)
    status = Column(String, default="researching")
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="accommodations")
    user = relationship("User", back_populates="accommodations")


class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String)
    duration = Column(String)
    price_per_person = Column(Float)
    currency = Column(String, default="USD")
    booking_url = Column(String)
    notes = Column(Text)
    status = Column(String, default="suggested")
    is_suggestion = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="activities")
    user = relationship("User", back_populates="activities")


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    content = Column(Text)
    category = Column(String, default="general")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trip = relationship("Trip", back_populates="notes")
    user = relationship("User", back_populates="notes")


class BudgetItem(Base):
    __tablename__ = "budget_items"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String)
    name = Column(String, nullable=False)
    estimated_amount = Column(Float, default=0)
    actual_amount = Column(Float, nullable=True)
    currency = Column(String, default="CAD")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="budget_items")
    user = relationship("User", back_populates="budget_items")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sender_name = Column(String, nullable=True)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")
