"""Schemas for lead qualification and calling agent."""

from datetime import datetime

from pydantic import BaseModel, Field


class LeadOut(BaseModel):
    """API response for lead data."""

    id: int
    chat_id: str
    phone_number: str
    name: str | None = None
    lead_score: int = 0
    lead_status: str = "cold"
    total_messages: int = 0
    product_searches: int = 0
    products_viewed: int = 0
    categories_interested: str = "[]"
    last_category: str | None = None
    last_price_range: str | None = None
    purchase_intent_count: int = 0
    size_queries: int = 0
    price_queries: int = 0
    callback_offered: bool = False
    callback_accepted: bool = False
    callback_declined: bool = False
    callback_offered_at: datetime | None = None
    call_status: str | None = None
    call_sid: str | None = None
    collected_name: str | None = None
    collected_address: str | None = None
    collected_product_interest: str | None = None
    call_summary: str | None = None
    call_duration: int | None = None
    call_recording_url: str | None = None
    first_contact_at: datetime | None = None
    last_activity_at: datetime | None = None
    called_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class CallLogOut(BaseModel):
    """API response for call log."""

    id: int
    lead_id: int
    chat_id: str
    call_sid: str
    phone_number: str
    status: str
    duration: int = 0
    elevenlabs_conversation_id: str | None = None
    transcript: str | None = None
    collected_data_json: str | None = None
    error_message: str | None = None
    initiated_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class ManualCallRequest(BaseModel):
    """Request body to manually trigger a call."""

    chat_id: str


class TwilioStatusPayload(BaseModel):
    """Twilio call status webhook payload."""

    CallSid: str
    CallStatus: str
    CallDuration: str | None = None
    To: str | None = None
    From_: str | None = Field(None, alias="From")
    Direction: str | None = None

    model_config = {"extra": "allow", "populate_by_name": True}


class ElevenLabsPostCallPayload(BaseModel):
    """ElevenLabs post-call webhook data."""

    agent_id: str | None = None
    conversation_id: str | None = None
    call_sid: str | None = None
    status: str | None = None
    transcript: str | None = None
    call_duration_secs: int | None = None
    collected_data: dict | None = None
    summary: str | None = None
    recording_url: str | None = None

    model_config = {"extra": "allow"}


class LeadListResponse(BaseModel):
    """Response for lead list endpoint."""

    total: int
    leads: list[LeadOut]


class LeadStatsResponse(BaseModel):
    """Quick stats for admin dashboard."""

    total_leads: int = 0
    cold_leads: int = 0
    warm_leads: int = 0
    hot_leads: int = 0
    calls_made: int = 0
    calls_completed: int = 0
    converted: int = 0
