import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter()
TRIP_ID = 1

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = """You are a helpful and enthusiastic travel planning assistant helping a group of friends plan an exciting trip from Montreal, Canada to Mauritius in April 2027.

You assist with:
- Flight research: typical routes go through Paris (Air France), Dubai (Emirates), or Doha (Qatar Airways). Direct flights don't exist — expect 1-2 connections and 20-30 hours total travel.
- Accommodation: Grand Baie in the north is lively, Flic en Flac on the west is great for snorkeling, Le Morne in the south is stunning. Resorts, villas, and Airbnbs all available.
- Activities: beaches, water sports, cultural sites, nature parks, food tours, adventure sports.
- Practical info: Canadians can enter visa-free for up to 90 days. Currency is Mauritian Rupee (MUR), roughly 1 CAD ≈ 35 MUR. April weather is warm (26-28°C) with low humidity — excellent timing.
- Budget planning, packing tips, and itinerary creation.

Group: 2-4 people traveling from Montreal (YUL). Trip dates: April 2027 (exact dates TBD).

Be friendly, specific, and practical. When recommending places, use real names. Help them have an unforgettable tropical vacation!"""


@router.get("/history", response_model=List[schemas.ChatMessageOut])
def get_chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.trip_id == TRIP_ID)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )


@router.post("/send", response_model=schemas.ChatMessageOut)
async def send_message(
    message: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_msg = models.ChatMessage(
        trip_id=TRIP_ID,
        user_id=current_user.id,
        sender_name=current_user.username,
        role="user",
        content=message.content,
    )
    db.add(user_msg)
    db.commit()

    history = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.trip_id == TRIP_ID)
        .order_by(models.ChatMessage.created_at.asc())
        .limit(30)
        .all()
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            )
            response.raise_for_status()
            ai_content = response.json()["message"]["content"]
    except httpx.ConnectError:
        ai_content = (
            "⚠️ I can't connect to the AI service right now.\n\n"
            "To enable AI chat:\n"
            "1. Install Ollama from https://ollama.com\n"
            "2. Run: `ollama serve`\n"
            "3. Pull a model: `ollama pull llama3.2`\n\n"
            "Once Ollama is running, refresh and try again!"
        )
    except Exception:
        ai_content = "⚠️ Something went wrong with the AI service. Please make sure Ollama is running and try again."

    ai_msg = models.ChatMessage(
        trip_id=TRIP_ID,
        user_id=None,
        sender_name="AI Assistant",
        role="assistant",
        content=ai_content,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    return ai_msg


@router.delete("/history")
def clear_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(models.ChatMessage).filter(models.ChatMessage.trip_id == TRIP_ID).delete()
    db.commit()
    return {"ok": True}
