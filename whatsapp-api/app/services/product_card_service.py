"""Reusable WhatsApp ecommerce product card component."""

from __future__ import annotations

import asyncio

from app.config import get_settings
from app.schemas.product import ProductOut
from app.schemas.whatsapp import (
    HyperSenderLinkPreviewPayload,
    ProductCardDeliveryResult,
    ProductCardInput,
)
from app.services.hypersender_service import hypersender_service
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

MAX_CAPTION_CHARS = 280


def _format_inr(amount: float) -> str:
    return f"₹{int(amount):,}"


def product_card_from_out(product: ProductOut) -> ProductCardInput:
    sizes = " | ".join(product.available_sizes[:5]) if product.available_sizes else "M | L | XL"
    return ProductCardInput(
        name=product.product_name,
        image=product.image_url,
        price=product.discount_price,
        old_price=product.price,
        discount=product.discount_percent,
        rating=product.rating,
        reviews=product.reviews_count,
        sizes=sizes,
        fabric=product.fabric,
        slug=product.slug or product.id,
        tag=product.tag,
        product_id=product.id,
        website_url=product.product_url,
    )


def build_product_card_body(card: ProductCardInput) -> str:
    """Compact premium caption on the image — no URLs."""
    tag = f"🏷️ *{card.tag.upper()}*\n" if card.tag else ""
    fabric = f"🧵 {card.fabric}\n" if card.fabric else ""

    body = (
        f"{tag}"
        f"🔥 *{card.name}*\n"
        f"💰 *{_format_inr(card.price)}*  ~~{_format_inr(card.old_price)}~~\n"
        f"🏷️ *{card.discount_percent}% OFF*\n"
        f"⭐ *{card.rating}* ({card.reviews} Reviews)\n"
        f"{fabric}"
        f"📏 {card.sizes}\n"
        f"────────\n"
        f"👇 Tap link cards below"
    )

    if len(body) > MAX_CAPTION_CHARS:
        body = (
            f"🔥 *{card.name}*\n"
            f"💰 *{_format_inr(card.price)}* ~~{_format_inr(card.old_price)}~~ *{card.discount_percent}% OFF*\n"
            f"⭐ {card.rating} ({card.reviews}) · 📏 {card.sizes}\n"
            f"👇 Tap link cards below"
        )
    return body


def build_view_link_card(chat_id: str, card: ProductCardInput) -> HyperSenderLinkPreviewPayload:
    return HyperSenderLinkPreviewPayload(
        chatId=chat_id,
        text=f"🔗 View on Website\n{card.view_url}",
        preview_title="🔗 View on Website",
        preview_description="",
        preview_url=card.view_url,
    )


def build_buy_link_card(chat_id: str, card: ProductCardInput) -> HyperSenderLinkPreviewPayload:
    return HyperSenderLinkPreviewPayload(
        chatId=chat_id,
        text=f"🛒 Buy Now\n{card.buy_url}",
        preview_title="🛒 Buy Now",
        preview_description="",
        preview_url=card.buy_url,
    )


def build_interactive_payload(to: str, card: ProductCardInput) -> dict:
    return {
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "header": {"type": "image", "image": {"link": card.image}},
            "body": {"text": build_product_card_body(card)},
            "action": {
                "buttons": [
                    {"type": "url", "text": "View Website", "url": card.view_url},
                    {"type": "url", "text": "Buy Now", "url": card.buy_url},
                ]
            },
        },
    }


def format_greeting(customer_name: str | None, intent_summary: str) -> str:
    from app.services.assistant_messages import products_found_intro
    return products_found_intro()


def format_quick_actions() -> str:
    from app.services.assistant_messages import quick_actions_footer
    return quick_actions_footer()


def format_footer() -> str:
    from app.services.assistant_messages import trust_footer
    return trust_footer()


def format_no_results(intent_summary: str) -> str:
    from app.services.assistant_messages import no_products_found
    return no_products_found()


async def send_product_card(chat_id: str, product: ProductCardInput | ProductOut) -> ProductCardDeliveryResult:
    """
    1. Image + product details (no URLs)
    2. Tapable link card — View on Website
    3. Tapable link card — Buy Now
    """
    card = product if isinstance(product, ProductCardInput) else product_card_from_out(product)
    result = ProductCardDeliveryResult(product_id=card.product_id, slug=card.slug)
    caption = build_product_card_body(card)

    try:
        await hypersender_service.send_image_with_caption(chat_id, card.image, caption)
        result.image_sent = True
    except Exception as exc:
        result.errors.append(f"Image card failed: {exc}")
        try:
            await hypersender_service.send_text(chat_id, caption)
            result.fallback_text = True
        except Exception as exc2:
            result.errors.append(f"Text fallback failed: {exc2}")
            return result

    await asyncio.sleep(0.6)

    try:
        await hypersender_service.send_clickable_link_card(chat_id, build_view_link_card(chat_id, card))
        result.cta_view_sent = True
    except Exception as exc:
        result.errors.append(f"View link card failed: {exc}")

    await asyncio.sleep(0.6)

    try:
        await hypersender_service.send_clickable_link_card(chat_id, build_buy_link_card(chat_id, card))
        result.cta_buy_sent = True
    except Exception as exc:
        result.errors.append(f"Buy link card failed: {exc}")

    return result


product_card_service = type("ProductCardService", (), {
    "from_product": staticmethod(product_card_from_out),
    "build_body": staticmethod(build_product_card_body),
    "build_interactive_payload": staticmethod(build_interactive_payload),
    "send": staticmethod(send_product_card),
})()
