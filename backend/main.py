from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
import models
from routes import auth as auth_routes
from routes import trips as trip_routes
from routes import flights as flight_routes
from routes import accommodations as accommodation_routes
from routes import activities as activity_routes
from routes import notes as note_routes
from routes import budget as budget_routes
from routes import chat as chat_routes


def seed_database():
    db = SessionLocal()
    try:
        if db.query(models.Trip).count() > 0:
            return

        trip = models.Trip(
            name="Montreal ✈ Mauritius — April 2027",
            origin="Montreal, Canada (YUL)",
            destination="Mauritius (MRU)",
            start_date="2027-04-01",
            end_date="2027-04-30",
            description="Our dream vacation to the paradise island of Mauritius!",
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)

        suggestions = [
            ("Snorkeling at Blue Bay Marine Park", "One of the finest snorkeling spots in the Indian Ocean — crystal-clear lagoon with turtles, tropical fish, and coral gardens.", "water_sports", "Half day", 50.0, "USD", "https://www.viator.com/Mauritius-attractions/Blue-Bay-Marine-Park/d821-a27588"),
            ("Hike Le Morne Brabant", "UNESCO World Heritage mountain rising 556m from the sea. Breathtaking coastal views and deep historical significance.", "nature", "Full day", 30.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Chamarel Seven Colored Earths", "Unique geological wonder — volcanic dunes in 7 naturally occurring colors. Pair with the beautiful Chamarel Waterfall nearby.", "nature", "Half day", 20.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Île aux Cerfs Catamaran Day Trip", "Full-day cruise to Mauritius's most famous island — white sand beaches, snorkeling stops, and a BBQ seafood lunch on board.", "beach", "Full day", 80.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Black River Gorges National Park", "Hike lush tropical rainforest trails to dramatic viewpoints. Best chance to spot rare endemic birds like the Mauritius kestrel.", "nature", "Full day", 10.0, "USD", "https://www.tripadvisor.com/Attraction_Review-g293816-d317610-Reviews-Black_River_Gorges_National_Park-Mauritius.html"),
            ("Grand Baie Beach & Waterfront", "Mauritius's liveliest beach town — excellent restaurants, water sports rentals, shopping, and a beautiful lagoon for swimming.", "beach", "Half day", 0.0, "USD", "https://www.tripadvisor.com/Tourism-g293816-Mauritius-Vacations.html"),
            ("Casela World of Adventures", "Wildlife park with safari trucks, zip-lining, quad biking, and the option to walk with lions or interact with giraffes.", "adventure", "Full day", 90.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Street Food Tour in Port Louis", "Explore the bustling Central Market and sample authentic Mauritian street food — dholl puri, roti, gato piment, and fresh juice.", "food", "Half day", 40.0, "USD", "https://www.getyourguide.com/mauritius-l933/"),
            ("Rhumerie de Chamarel Rum Distillery", "Award-winning artisanal rum distillery tour with tastings, set amid stunning plantation landscape with panoramic views.", "culture", "Half day", 25.0, "USD", "https://www.chamarel-rum.com"),
            ("Underwater Waterfall Illusion Flight", "Stunning optical illusion off Le Morne peninsula, best seen from a helicopter or speedboat. A truly unique Mauritius experience.", "nature", "2 hours", 150.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Dolphin Watching in Tamarin Bay", "Early morning speedboat trip to swim with wild spinner dolphins in the open ocean. Magical and unforgettable.", "nature", "Half day", 60.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Kitesurfing Lesson at Le Morne", "World-renowned kitesurfing spot with consistent trade winds. Professional instructors for all skill levels.", "water_sports", "Full day", 120.0, "USD", "https://www.viator.com/Mauritius/d821-ttd"),
            ("Pamplemousses Botanical Garden", "One of the oldest botanical gardens in the southern hemisphere — home to giant Victoria Amazonica water lilies.", "nature", "Half day", 10.0, "USD", "https://www.tripadvisor.com/Attraction_Review-g293816-d317614-Reviews-Sir_Seewoosagur_Ramgoolam_Botanical_Garden-Mauritius.html"),
            ("Trou aux Cerfs Volcanic Crater", "Dormant volcano crater offering 360° panoramic views across the island and down to the coast. Free to visit.", "nature", "2 hours", 0.0, "USD", "https://www.tripadvisor.com/Attraction_Review-g616001-d1024987-Reviews-Trou_aux_Cerfs-Curepipe_Plaine_Wilhems_District_Mauritius.html"),
            ("Flacq Open Air Market", "The largest open-air market in Mauritius — perfect for spices, local produce, handmade crafts, and unique souvenirs.", "culture", "Half day", 0.0, "USD", "https://www.tripadvisor.com/Attraction_Review-g293816-d1416095-Reviews-Flacq_Market-Mauritius.html"),
        ]

        for name, desc, category, duration, price, currency, url in suggestions:
            db.add(models.Activity(
                trip_id=trip.id,
                user_id=None,
                name=name,
                description=desc,
                category=category,
                duration=duration,
                price_per_person=price,
                currency=currency,
                booking_url=url,
                status="suggested",
                is_suggestion=True,
            ))

        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(title="Trip Planner — Montreal to Mauritius", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(trip_routes.router, prefix="/api/trips", tags=["Trips"])
app.include_router(flight_routes.router, prefix="/api/flights", tags=["Flights"])
app.include_router(accommodation_routes.router, prefix="/api/accommodations", tags=["Accommodations"])
app.include_router(activity_routes.router, prefix="/api/activities", tags=["Activities"])
app.include_router(note_routes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(budget_routes.router, prefix="/api/budget", tags=["Budget"])
app.include_router(chat_routes.router, prefix="/api/chat", tags=["Chat"])


@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Trip Planner API is running!"}
