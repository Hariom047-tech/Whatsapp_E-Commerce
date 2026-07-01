"""WhatsApp webhook and product card schemas."""

from typing import Any, Literal

from pydantic import BaseModel, Field, computed_field

from app.config import get_settings


class HyperSenderWebhookPayload(BaseModel):
    """Flexible webhook payload — HyperSender events vary by type."""

    event: str | None = None
    instance: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    payload: dict[str, Any] = Field(default_factory=dict)

    model_config = {"extra": "allow"}


class IncomingMessage(BaseModel):
    chat_id: str
    message_id: str | None = None
    text: str
    from_me: bool = False
    sender_name: str | None = None


class WhatsAppWebhookResponse(BaseModel):
    status: str = "ok"
    message: str | None = None
    products_found: int = 0


class ProductCardInput(BaseModel):
    """Normalized product card input for WhatsApp delivery."""

    name: str
    image: str
    price: float
    old_price: float
    discount: int | None = None
    rating: float
    reviews: int
    sizes: str
    fabric: str | None = None
    slug: str
    tag: str | None = None
    product_id: str | None = None
    website_url: str | None = None

    model_config = {"extra": "ignore"}

    @computed_field
    @property
    def discount_percent(self) -> int:
        if self.discount is not None:
            return self.discount
        if self.old_price <= 0:
            return 0
        return round((1 - self.price / self.old_price) * 100)

    @property
    def view_url(self) -> str:
        raw = self.website_url
        if raw:
            return _public_product_url(raw)
        base = get_settings().website_base_url.rstrip("/")
        return _public_product_url(f"{base}/product/{self.slug or self.product_id}")

    @property
    def buy_url(self) -> str:
        return f"{self.view_url}?buy=1"


def _public_product_url(url: str) -> str:
    """Rewrite localhost links to public base (ngrok) for WhatsApp link previews."""
    settings = get_settings()
    public = (settings.public_website_base_url or "").strip().rstrip("/")
    if not public:
        return url
    for local in ("http://localhost:3000", "http://127.0.0.1:3000"):
        if url.startswith(local):
            return url.replace(local, public, 1)
    return url


class InteractiveButton(BaseModel):
    type: Literal["url"] = "url"
    text: str
    url: str


class InteractiveHeaderImage(BaseModel):
    type: Literal["image"] = "image"
    image: dict[str, str]


class InteractiveBody(BaseModel):
    text: str


class InteractiveAction(BaseModel):
    buttons: list[InteractiveButton]


class InteractiveProductMessage(BaseModel):
    """Meta WhatsApp Cloud API interactive button + image header format."""

    type: Literal["interactive"] = "interactive"
    interactive: dict[str, Any]

    @classmethod
    def from_product_card(cls, to: str, card: ProductCardInput, body_text: str) -> dict[str, Any]:
        """Build Cloud API payload (reference format for Meta WABA)."""
        return {
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "header": {
                    "type": "image",
                    "image": {"link": card.image},
                },
                "body": {"text": body_text},
                "action": {
                    "buttons": [
                        {
                            "type": "reply",
                            "reply": {"id": f"view_{card.slug}", "title": "View Website"},
                        },
                        {
                            "type": "reply",
                            "reply": {"id": f"buy_{card.slug}", "title": "Buy Now"},
                        },
                    ]
                },
            },
        }


class HyperSenderLinkPreviewPayload(BaseModel):
    """HyperSender send-link-custom-preview — tapable link card (not raw URL text)."""

    chatId: str
    text: str
    preview_title: str
    preview_description: str
    preview_url: str
    preview_image_url: str | None = None
    high_quality: bool = True
    reply_to: str | None = None


class ProductCardDeliveryResult(BaseModel):
    product_id: str | None = None
    slug: str
    image_sent: bool = False
    cta_view_sent: bool = False
    cta_buy_sent: bool = False
    fallback_text: bool = False
    errors: list[str] = Field(default_factory=list)
