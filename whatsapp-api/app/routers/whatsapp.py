"""WhatsApp webhook and conversation orchestration."""

import asyncio
import json

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.connection import SessionLocal
from app.models.conversation import ConversationContext
from app.schemas.intent import ConversationState, ShoppingIntent
from app.schemas.product import ProductOut
from app.schemas.whatsapp import WhatsAppWebhookResponse
from app.services.ai_service import ai_service
from app.services.assistant_messages import (
    browse_all,
    confused_help,
    format_price_reply,
    format_size_available,
    format_size_unavailable,
    no_products_found,
    products_found_intro,
    purchase_help,
    quick_actions_footer,
    trust_footer,
    upsell_jeans,
    welcome_greeting,
)
from app.services.hypersender_service import hypersender_service
from app.services.product_card_service import send_product_card
from app.services.product_search import product_search_service
from app.services.webhook_parser import parse_incoming_message
from app.utils.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/webhook", tags=["WhatsApp"])
settings = get_settings()


def _verify_webhook(authorization: str | None, x_webhook_secret: str | None = None) -> None:
    secret = settings.hypersender_webhook_secret
    if not secret:
        return
    token = (authorization or "").replace("Bearer ", "").strip()
    if x_webhook_secret and x_webhook_secret.strip() == secret:
        return
    if token == secret:
        return
    raise HTTPException(status_code=401, detail="Invalid webhook authorization")


def _load_state(ctx: ConversationContext | None) -> ConversationState:
    if not ctx or not ctx.last_intent_json:
        return ConversationState()
    try:
        data = json.loads(ctx.last_intent_json)
        if "intent" in data or "last_products" in data:
            return ConversationState(**data)
        return ConversationState(intent=ShoppingIntent(**data))
    except Exception:
        return ConversationState()


def _save_state(db: Session, chat_id: str, message: str, state: ConversationState) -> None:
    ctx = db.get(ConversationContext, chat_id)
    payload = state.model_dump_json()
    if ctx:
        ctx.last_message = message
        ctx.last_intent_json = payload
    else:
        ctx = ConversationContext(chat_id=chat_id, last_message=message, last_intent_json=payload)
        db.add(ctx)
    db.commit()


def _products_to_dict(products: list[ProductOut]) -> list[dict]:
    return [p.model_dump() for p in products]


def _reply_from_last_products(state: ConversationState, intent: ShoppingIntent) -> str | None:
    if not state.last_products:
        return "Pehle koi product search karo 😊 — jaise *red shirt under 799*"

    product = state.last_products[0]
    name = product.get("product_name", "Product")
    price = product.get("discount_price", 0)
    sizes = product.get("available_sizes") or []

    if intent.intent_type == "price_query":
        return format_price_reply(name, float(price))

    if intent.intent_type == "size_query":
        requested = (intent.size or "").upper()
        if not requested:
            return f"Available sizes: {' | '.join(sizes)}"
        if requested in [s.upper() for s in sizes]:
            return format_size_available(requested)
        return format_size_unavailable(requested, sizes)

    return None


async def _process_message(chat_id: str, text: str, sender_name: str | None, db: Session) -> int:
    await hypersender_service.start_typing(chat_id)

    ctx = db.get(ConversationContext, chat_id)
    state = _load_state(ctx)
    history = ctx.last_message if ctx else None

    intent = ai_service.extract_intent(text, history)
    logger.info("AI intent: %s", intent.model_dump(exclude_none=True))

    # --- Non-search intents ---
    if intent.intent_type == "greeting":
        await hypersender_service.send_text(chat_id, intent.clarification_question or welcome_greeting())
        _save_state(db, chat_id, text, ConversationState(intent=intent))
        await hypersender_service.stop_typing(chat_id)
        return 0

    if intent.intent_type == "purchase_intent":
        await hypersender_service.send_text(chat_id, intent.reply_message or purchase_help())
        await hypersender_service.stop_typing(chat_id)
        return 0

    if intent.intent_type == "confused":
        await hypersender_service.send_text(chat_id, intent.reply_message or confused_help())
        await hypersender_service.stop_typing(chat_id)
        return 0

    if intent.intent_type == "browse":
        await hypersender_service.send_text(chat_id, browse_all())
        await hypersender_service.stop_typing(chat_id)
        return 0

    if intent.intent_type in ("price_query", "size_query"):
        reply = _reply_from_last_products(state, intent) or intent.reply_message
        await hypersender_service.send_text(chat_id, reply or "Kya product ke baare me puchna hai? 😊")
        await hypersender_service.stop_typing(chat_id)
        return 0

    if intent.intent_type in ("clarify", "unknown"):
        reply = intent.clarification_question or intent.reply_message or confused_help()
        await hypersender_service.send_text(chat_id, reply)
        _save_state(db, chat_id, text, ConversationState(intent=intent))
        await hypersender_service.stop_typing(chat_id)
        return 0

    # Quick action shortcuts
    lower = text.lower()
    if "view all" in lower or "browse" in lower:
        await hypersender_service.send_text(chat_id, browse_all())
        await hypersender_service.stop_typing(chat_id)
        return 0

    if "jeans" in lower and ("haan" in lower or "yes" in lower or "dikhao" in lower):
        intent = ShoppingIntent(intent_type="search", category="jeans", query_text=text)

    # --- Product search ---
    result = product_search_service.search(db, intent, limit=settings.max_products_per_reply)

    if not result.products:
        await hypersender_service.send_text(chat_id, no_products_found() + trust_footer())
        _save_state(db, chat_id, text, ConversationState(intent=intent, last_products=[]))
        await hypersender_service.stop_typing(chat_id)
        return 0

    await hypersender_service.send_text(chat_id, products_found_intro())
    await asyncio.sleep(1.0)

    sent = 0
    for i, product in enumerate(result.products):
        try:
            delivery = await send_product_card(chat_id, product)
            if delivery.image_sent or delivery.fallback_text:
                sent += 1
            if i < len(result.products) - 1:
                await asyncio.sleep(1.5)
        except Exception as exc:
            logger.exception("Failed to send product card %s: %s", product.id, exc)

    _save_state(
        db,
        chat_id,
        text,
        ConversationState(intent=intent, last_products=_products_to_dict(result.products)),
    )

    # Upsell when customer searched shirts
    cat = (intent.category or "").lower()
    if cat in ("shirt", "shirts", "t-shirt", "polo", "overshirt"):
        await asyncio.sleep(0.8)
        await hypersender_service.send_text(chat_id, upsell_jeans())

    await hypersender_service.send_text(chat_id, quick_actions_footer() + trust_footer())
    await hypersender_service.stop_typing(chat_id)
    return sent


@router.post("/whatsapp", response_model=WhatsAppWebhookResponse)
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
):
    _verify_webhook(authorization, x_webhook_secret)

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info("Webhook received: event=%s", payload.get("event", "unknown"))

    incoming = parse_incoming_message(payload)
    if not incoming:
        return WhatsAppWebhookResponse(status="ignored", message="No actionable message")

    logger.info("Parsed message from %s: %s", incoming.chat_id, incoming.text[:80])

    async def handle():
        db = SessionLocal()
        try:
            count = await _process_message(incoming.chat_id, incoming.text, incoming.sender_name, db)
            logger.info("Processed message for %s — %d product cards sent", incoming.chat_id, count)
        except Exception as exc:
            logger.exception("Error processing WhatsApp message: %s", exc)
            try:
                await hypersender_service.stop_typing(incoming.chat_id)
                await hypersender_service.send_text(
                    incoming.chat_id,
                    "😔 Sorry, kuch technical issue aa gaya. Thodi der baad try karo.\n"
                    f"🌐 {settings.website_base_url}/shop",
                )
            except Exception:
                pass
        finally:
            db.close()

    background_tasks.add_task(handle)
    return WhatsAppWebhookResponse(status="accepted", message="Processing in background")


@router.get("/whatsapp", summary="Webhook verification")
async def whatsapp_webhook_verify():
    return {"status": "ok", "service": settings.app_name, "assistant": "Hariom Fashion AI"}
