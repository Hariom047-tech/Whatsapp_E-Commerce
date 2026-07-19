"""Lead scoring engine — tracks user behavior and qualifies leads."""

import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.lead import Lead
from app.schemas.intent import ShoppingIntent
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class LeadScoringService:
    """Calculates and updates lead scores based on conversation signals."""

    def extract_phone_from_chat_id(self, chat_id: str) -> str:
        """Convert WhatsApp JID to phone number.

        '919876543210@c.us' → '+919876543210'
        '919876543210@s.whatsapp.net' → '+919876543210'
        """
        phone = chat_id.split("@")[0]
        if not phone.startswith("+"):
            phone = f"+{phone}"
        return phone

    def get_or_create_lead(
        self, db: Session, chat_id: str, sender_name: str | None = None
    ) -> Lead:
        """Get existing lead or create new one."""
        lead = db.query(Lead).filter(Lead.chat_id == chat_id).first()
        if not lead:
            lead = Lead(
                chat_id=chat_id,
                phone_number=self.extract_phone_from_chat_id(chat_id),
                name=sender_name,
                first_contact_at=datetime.utcnow(),
            )
            db.add(lead)
            db.commit()
            db.refresh(lead)
            logger.info("New lead created: %s (name: %s)", chat_id, sender_name)
        elif sender_name and not lead.name:
            lead.name = sender_name
            db.commit()
        return lead

    def update_lead(
        self,
        db: Session,
        chat_id: str,
        sender_name: str | None,
        intent: ShoppingIntent,
        products_shown: int = 0,
        product_prices: list[float] | None = None,
    ) -> Lead:
        """Update lead after every message and recalculate score."""
        lead = self.get_or_create_lead(db, chat_id, sender_name)

        # Track message count
        lead.total_messages += 1

        # Track by intent type
        if intent.intent_type == "search":
            lead.product_searches += 1
            if intent.category:
                categories = json.loads(lead.categories_interested or "[]")
                if intent.category not in categories:
                    categories.append(intent.category)
                    lead.categories_interested = json.dumps(categories)
                lead.last_category = intent.category
            if intent.max_price:
                lead.last_price_range = f"under {int(intent.max_price)}"
        elif intent.intent_type == "purchase_intent":
            lead.purchase_intent_count += 1
        elif intent.intent_type == "price_query":
            lead.price_queries += 1
        elif intent.intent_type == "size_query":
            lead.size_queries += 1

        # Track products shown
        if products_shown > 0:
            lead.products_viewed += products_shown

        # Recalculate score
        lead.lead_score = self.calculate_score(lead, intent, product_prices)
        lead.lead_status = self._score_to_status(lead.lead_score)
        lead.last_activity_at = datetime.utcnow()

        db.commit()
        db.refresh(lead)

        logger.info(
            "Lead updated: %s | score=%d | status=%s | messages=%d",
            chat_id,
            lead.lead_score,
            lead.lead_status,
            lead.total_messages,
        )
        return lead

    def calculate_score(
        self,
        lead: Lead,
        current_intent: ShoppingIntent,
        product_prices: list[float] | None = None,
    ) -> int:
        """Calculate total lead score based on all accumulated signals."""
        score = 0

        # 1. Message engagement (capped at 30 points)
        score += min(lead.total_messages * 3, 30)

        # 2. Product searches (+8 each, capped at 40)
        score += min(lead.product_searches * 8, 40)

        # 3. Products viewed (+4 each, capped at 20)
        score += min(lead.products_viewed * 4, 20)

        # 4. Purchase intent (+15 each, capped at 30)
        score += min(lead.purchase_intent_count * 15, 30)

        # 5. Price queries (+6 each, capped at 12)
        score += min(lead.price_queries * 6, 12)

        # 6. Size queries (+8 each, capped at 16)
        score += min(lead.size_queries * 8, 16)

        # 7. High-value products viewed (price > ₹1500)
        if product_prices:
            high_value = sum(1 for p in product_prices if p > 1500)
            score += min(high_value * 5, 15)

        # 8. Multiple categories browsed
        categories = json.loads(lead.categories_interested or "[]")
        if len(categories) >= 2:
            score += 5
        if len(categories) >= 4:
            score += 5

        # 9. Deep session (> 5 messages)
        if lead.total_messages > 5:
            score += 7

        # 10. Specific criteria (color + size + price in current intent)
        specifics = sum([
            bool(current_intent.color),
            bool(current_intent.size),
            bool(current_intent.max_price),
        ])
        if specifics >= 3:
            score += 12
        elif specifics >= 2:
            score += 6

        # 11. Repeat visitor (came back after 24h)
        if lead.first_contact_at and lead.last_activity_at:
            gap = datetime.utcnow() - lead.last_activity_at
            if gap > timedelta(hours=24):
                score += 10

        # Cap at 100
        return min(score, 100)

    def _score_to_status(self, score: int) -> str:
        """Convert numeric score to lead status string."""
        if score >= settings.lead_hot_threshold:
            return "hot"
        elif score >= settings.lead_warm_threshold:
            return "warm"
        return "cold"

    def should_offer_callback(self, lead: Lead) -> bool:
        """Check if we should offer a callback to this lead."""
        if lead.lead_status != "hot":
            return False

        if lead.call_status in ("calling", "completed"):
            return False

        if lead.callback_offered:
            # Check cooldown period
            if lead.callback_offered_at:
                cooldown = timedelta(hours=settings.callback_cooldown_hours)
                if datetime.utcnow() - lead.callback_offered_at < cooldown:
                    return False

            # If previously declined and still within cooldown, don't offer again
            if lead.callback_declined:
                if lead.callback_offered_at:
                    cooldown = timedelta(hours=settings.callback_cooldown_hours)
                    if datetime.utcnow() - lead.callback_offered_at < cooldown:
                        return False

        return True

    def mark_callback_offered(self, db: Session, lead: Lead) -> None:
        """Mark that a callback was offered to this lead."""
        lead.callback_offered = True
        lead.callback_offered_at = datetime.utcnow()
        db.commit()

    def mark_callback_accepted(self, db: Session, lead: Lead) -> None:
        """Mark that the lead accepted a callback."""
        lead.callback_accepted = True
        lead.callback_declined = False
        lead.call_status = "pending"
        db.commit()

    def mark_callback_declined(self, db: Session, lead: Lead) -> None:
        """Mark that the lead declined a callback."""
        lead.callback_declined = True
        lead.callback_accepted = False
        db.commit()


lead_scoring_service = LeadScoringService()
