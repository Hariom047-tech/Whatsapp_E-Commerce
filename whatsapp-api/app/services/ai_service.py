"""Hariom Fashion AI Assistant — intent extraction & conversation intelligence."""

import json
import re

from openai import OpenAI

from app.config import get_settings
from app.schemas.intent import ShoppingIntent
from app.services.assistant_messages import welcome_greeting
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

SYSTEM_PROMPT = f"""You are "Hariom Fashion AI Assistant", a friendly professional shopping assistant for {settings.brand_name} — a men's clothing ecommerce store in India.

PERSONALITY: Friendly, helpful, polite, natural, fashion expert, sales-focused but not pushy. Talk like a real human WhatsApp assistant. Never robotic. Use emojis naturally (not too many). Never say "I am an AI" — say "your shopping assistant".

LANGUAGES: Understand English, Hindi, Hinglish. Match the customer's language style in reply_message and clarification_question.

RULES:
- NEVER invent products or prices. Only extract intent for database search.
- intent_type="search" when customer wants to find/browse products.
- intent_type="greeting" for hi/hello/hey/namaste/good morning/evening.
- intent_type="clarify" when request is too vague (e.g. only "shirt" with no color/budget).
- intent_type="purchase_intent" for buy/order/purchase/how to buy questions.
- intent_type="confused" when customer is lost or doesn't know what they want.
- intent_type="browse" for view all / show everything / full collection.
- intent_type="price_query" for kitne ka / price / cost questions.
- intent_type="size_query" for size availability questions (XL hai? size M?).
- intent_type="unknown" only if truly unclear.

EXTRACT for search: category, subcategory, color, size, max_price, min_price, occasion, style.
Categories: shirt, t-shirt, jeans, trousers, cargo-pants, shorts, shoes, overshirt, polo, jacket.
max_price from: "under 799", "below 1000", "999 tak", "under ₹799".

For greeting: set clarification_question to the standard welcome (assistant handles template).
For clarify/confused/purchase: write a short friendly reply_message in customer's language (2-4 lines max).
For price_query/size_query: set reply_message null — backend uses last shown products.

Respond ONLY with valid JSON:
{{
  "intent_type": "search|clarify|greeting|unknown|purchase_intent|confused|browse|price_query|size_query",
  "category": string|null,
  "subcategory": string|null,
  "color": string|null,
  "max_price": number|null,
  "min_price": number|null,
  "size": string|null,
  "brand": string|null,
  "occasion": string|null,
  "style": string|null,
  "query_text": string|null,
  "clarification_question": string|null,
  "reply_message": string|null,
  "confidence": number
}}
"""


class AIService:
    def __init__(self):
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def extract_intent(self, message: str, chat_history: str | None = None) -> ShoppingIntent:
        message = message.strip()
        if not message:
            return ShoppingIntent(
                intent_type="unknown",
                clarification_question="Please send a message 😊",
            )

        if self._client:
            try:
                return self._extract_with_openai(message, chat_history)
            except Exception as exc:
                logger.warning("OpenAI intent extraction failed, using fallback: %s", exc)

        return self._extract_with_rules(message)

    def _extract_with_openai(self, message: str, chat_history: str | None) -> ShoppingIntent:
        user_content = message
        if chat_history:
            user_content = f"Previous customer message: {chat_history}\n\nNew message: {message}"

        response = self._client.chat.completions.create(
            model=settings.openai_model,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        intent = ShoppingIntent(**data)

        if intent.intent_type == "greeting" and not intent.clarification_question:
            intent.clarification_question = welcome_greeting()
        return intent

    def _extract_with_rules(self, message: str) -> ShoppingIntent:
        text = message.lower().strip()

        if re.search(r"\b(hi{1,3}|hello|hey|namaste|good\s*(morning|evening|afternoon))\b", text):
            return ShoppingIntent(intent_type="greeting", clarification_question=welcome_greeting())

        if any(w in text for w in ("order karna", "how to buy", "want to buy", "khareedna", "purchase karna")):
            return ShoppingIntent(intent_type="purchase_intent")

        if any(w in text for w in ("samajh nahi", "confused", "pata nahi", "help me choose", "kya lun")):
            return ShoppingIntent(intent_type="confused")

        if any(w in text for w in ("view all", "browse", "sab dikhao", "full collection")):
            return ShoppingIntent(intent_type="browse")

        category = None
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                category = cat
                break

        color = next((c for c in COLOR_KEYWORDS if c in text), None)
        size = self._extract_size(text)
        max_price = self._extract_max_price(text)
        is_product_search = bool(
            category
            or color
            or max_price
            or any(w in text for w in ("chahiye", "chaiye", "want", "show", "dikhao", "dhoond", "find"))
        )

        if is_product_search:
            if category and not color and not max_price and not size:
                return ShoppingIntent(
                    intent_type="clarify",
                    category=category,
                    clarification_question=(
                        f"Sure 😊 Kaunsa *{category}* chahiye?\n\n"
                        "Colour, budget aur size bata do — jaise *red under ₹799 size M*"
                    ),
                )
            return ShoppingIntent(
                intent_type="search",
                category=category,
                color=color,
                max_price=max_price,
                size=size,
                query_text=message,
                confidence=0.7,
            )

        if re.search(r"\b(price|kitne ka|kitna|cost|rate)\b", text):
            return ShoppingIntent(intent_type="price_query")

        if re.search(r"\b(available|milega)\b", text) and size:
            return ShoppingIntent(intent_type="size_query", size=size)

        return ShoppingIntent(
            intent_type="clarify",
            clarification_question=(
                "Kya dhundh rahe ho? 😊\n\n"
                "Example: *red shirt under 799 size M*"
            ),
        )

    @staticmethod
    def _extract_size(text: str) -> str | None:
        match = re.search(r"\b(xxl|xl|l|m|s|xxs|\d{2})\b", text)
        return match.group(1).upper() if match else None

    @staticmethod
    def _extract_max_price(text: str) -> float | None:
        for pattern in (
            r"(?:under|below|tak|se kam|max)\s*₹?\s*(\d+)",
            r"₹\s*(\d+)\s*(?:tak|under|se)",
            r"\b(\d{3,5})\b",
        ):
            match = re.search(pattern, text)
            if match:
                return float(match.group(1))
        return None


CATEGORY_KEYWORDS = {
    "shirt": ["shirt", "shirts"],
    "t-shirt": ["t-shirt", "tshirt", "t shirt", "tee"],
    "jeans": ["jeans", "denim", "jeans dikhao"],
    "trousers": ["trouser", "trousers", "pant", "pants", "chino", "office wear"],
    "cargo-pants": ["cargo"],
    "shorts": ["shorts"],
    "shoes": ["shoe", "shoes", "sneaker"],
    "overshirt": ["overshirt", "jacket"],
    "polo": ["polo"],
}

COLOR_KEYWORDS = [
    "red", "blue", "black", "white", "navy", "olive", "burgundy",
    "green", "grey", "gray", "beige", "brown", "yellow", "maroon",
]

ai_service = AIService()
