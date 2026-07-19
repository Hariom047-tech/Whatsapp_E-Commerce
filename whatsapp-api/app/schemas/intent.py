"""Shopping intent extracted by Hariom Fashion AI Assistant."""

from typing import Literal

from pydantic import BaseModel, Field


IntentType = Literal[
    "search",
    "clarify",
    "greeting",
    "unknown",
    "purchase_intent",
    "confused",
    "browse",
    "price_query",
    "size_query",
    "callback_accept",
    "callback_decline",
]


class ShoppingIntent(BaseModel):
    intent_type: IntentType = "search"
    category: str | None = None
    subcategory: str | None = None
    color: str | None = None
    max_price: float | None = None
    min_price: float | None = None
    size: str | None = None
    brand: str | None = None
    occasion: str | None = None
    style: str | None = None
    query_text: str | None = None
    clarification_question: str | None = None
    reply_message: str | None = None
    confidence: float = Field(default=0.8, ge=0, le=1)


class ConversationState(BaseModel):
    """Persisted per-chat context for multi-turn shopping."""

    intent: ShoppingIntent | None = None
    last_products: list[dict] = Field(default_factory=list)
