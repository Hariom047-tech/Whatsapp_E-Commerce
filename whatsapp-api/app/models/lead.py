"""Lead tracking and qualification for WhatsApp conversations."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Lead(Base):
    __tablename__ = "wa_leads"

    # Identity
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chat_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(20), index=True)
    name: Mapped[str | None] = mapped_column(String(255))

    # Scoring
    lead_score: Mapped[int] = mapped_column(Integer, default=0)
    lead_status: Mapped[str] = mapped_column(String(20), default="cold")

    # Behavior tracking
    total_messages: Mapped[int] = mapped_column(Integer, default=0)
    product_searches: Mapped[int] = mapped_column(Integer, default=0)
    products_viewed: Mapped[int] = mapped_column(Integer, default=0)
    categories_interested: Mapped[str] = mapped_column(Text, default="[]")
    last_category: Mapped[str | None] = mapped_column(String(100))
    last_price_range: Mapped[str | None] = mapped_column(String(50))
    purchase_intent_count: Mapped[int] = mapped_column(Integer, default=0)
    size_queries: Mapped[int] = mapped_column(Integer, default=0)
    price_queries: Mapped[int] = mapped_column(Integer, default=0)

    # Callback tracking
    callback_offered: Mapped[bool] = mapped_column(Boolean, default=False)
    callback_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    callback_declined: Mapped[bool] = mapped_column(Boolean, default=False)
    callback_offered_at: Mapped[datetime | None] = mapped_column(DateTime)

    # Call tracking
    call_status: Mapped[str | None] = mapped_column(String(30))
    call_sid: Mapped[str | None] = mapped_column(String(64))

    # Data collected during call
    collected_name: Mapped[str | None] = mapped_column(String(255))
    collected_address: Mapped[str | None] = mapped_column(Text)
    collected_product_interest: Mapped[str | None] = mapped_column(Text)
    call_summary: Mapped[str | None] = mapped_column(Text)
    call_duration: Mapped[int | None] = mapped_column(Integer)
    call_recording_url: Mapped[str | None] = mapped_column(Text)

    # Timestamps
    first_contact_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_activity_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    called_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
