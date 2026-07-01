"""Dev/test endpoint to simulate WhatsApp messages without HyperSender."""

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.connection import SessionLocal, get_db
from app.routers.whatsapp import _process_message
from app.schemas.intent import ShoppingIntent
from app.schemas.product import ProductSearchResult
from app.services.ai_service import ai_service
from app.services.assistant_messages import products_found_intro, welcome_greeting
from app.services.message_formatter import format_product_caption, format_footer
from app.services.product_search import product_search_service

router = APIRouter(prefix="/dev", tags=["Development"])
settings = get_settings()


class TestMessageRequest(BaseModel):
    message: str = Field(..., example="Mujhe red colour ki shirt chahiye under 799 size M")
    chat_id: str = Field(default="919999999999@c.us")
    sender_name: str = Field(default="Test Customer")
    dry_run: bool = Field(default=True, description="If true, returns preview without sending WhatsApp messages")


class TestMessageResponse(BaseModel):
    intent: ShoppingIntent
    search_result: ProductSearchResult | None = None
    whatsapp_preview: list[str] = []
    products_found: int = 0


@router.post("/simulate-message", response_model=TestMessageResponse)
async def simulate_message(body: TestMessageRequest, db: Session = Depends(get_db)):
    """
    Test the full AI → search → message pipeline without HyperSender.
    Use Swagger to try different customer messages.
    """
    intent = ai_service.extract_intent(body.message)

    if intent.intent_type in ("clarify", "greeting", "unknown"):
        return TestMessageResponse(
            intent=intent,
            whatsapp_preview=[intent.clarification_question or "Need more info"],
            products_found=0,
        )

    result = product_search_service.search(db, intent, limit=settings.max_products_per_reply)
    previews = []

    if result.products:
        previews.append(products_found_intro())
        for p in result.products:
            previews.append(f"[IMAGE: {p.image_url}]")
            previews.append(format_product_caption(p))
        previews.append(format_footer())
    else:
        previews.append(f"No products found for: {result.intent_summary}")

    if not body.dry_run:
        await _process_message(body.chat_id, body.message, body.sender_name, db)

    return TestMessageResponse(
        intent=intent,
        search_result=result,
        whatsapp_preview=previews,
        products_found=len(result.products),
    )
