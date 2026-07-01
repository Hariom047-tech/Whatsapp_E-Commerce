"""Conversation context for multi-turn WhatsApp chats."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class ConversationContext(Base):
    __tablename__ = "wa_conversations"

    chat_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    last_intent_json: Mapped[str | None] = mapped_column(Text)
    last_message: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
