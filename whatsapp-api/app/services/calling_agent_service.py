"""AI Calling Agent — Twilio + ElevenLabs Conversational AI integration."""

import json
from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.call_log import CallLog
from app.models.lead import Lead
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

ELEVENLABS_AGENT_PROMPT = """You are a friendly, warm fashion consultant calling on behalf of Hariom Fashion — a premium men's clothing brand in India.

CONTEXT ABOUT THIS CUSTOMER:
- Name: {customer_name}
- They were browsing: {products_interested}
- Categories they searched: {categories}
- Their budget range: {price_range}

YOUR CONVERSATION GOALS (in order):
1. Greet warmly — "Hi! Main Hariom Fashion se bol raha hun. Aapne hamare WhatsApp pe kuch products dekhe the..."
2. Confirm their name — "Kya main aapka naam jaan sakta hun?"
3. Understand their needs — "Aap kis occasion ke liye shopping kar rahe hain?"
4. Recommend products — Based on what they browsed, suggest matching items
5. If interested in buying — collect delivery address: "Delivery ke liye address bata dijiye"
6. Thank them — "Thank you! Aapko WhatsApp pe order link bhej dete hain"

LANGUAGE: Speak in Hinglish (Hindi + English mix). Be warm, natural, friendly. NOT robotic or scripty.

IMPORTANT RULES:
- If they say they're busy or not interested, say "No problem! Aap jab chahe WhatsApp pe message kar sakte hain" and end politely
- Never be pushy. Be like a helpful friend, not a salesperson
- Keep the call under 3 minutes
- If they mention a specific product, note it down

COLLECT AND RETURN THIS DATA:
- name: customer's full name
- address: delivery address if provided
- product_interest: specific products or categories they want
- occasion: why they're shopping (casual, office, wedding, etc.)
- ready_to_buy: yes/no/maybe
- preferred_budget: their budget range
- notes: any other important details"""


class CallingAgentService:
    """Manages Twilio outbound calls with ElevenLabs AI voice agent."""

    def __init__(self):
        self._twilio_client = None

    @property
    def twilio_client(self):
        """Lazy-initialize Twilio client on first access."""
        if not self._twilio_client:
            try:
                from twilio.rest import Client
                self._twilio_client = Client(
                    settings.twilio_account_sid,
                    settings.twilio_auth_token,
                )
            except Exception as e:
                logger.error("Failed to initialize Twilio client: %s", e)
        return self._twilio_client

    @property
    def elevenlabs_available(self) -> bool:
        """Check if ElevenLabs Conversational AI is configured."""
        return bool(settings.elevenlabs_api_key and settings.elevenlabs_agent_id)

    @property
    def twilio_available(self) -> bool:
        """Check if Twilio is configured."""
        return bool(
            settings.twilio_account_sid
            and settings.twilio_auth_token
            and settings.twilio_phone_number
        )

    def _build_agent_context(self, lead: Lead) -> dict:
        """Build dynamic context for the ElevenLabs agent."""
        categories = json.loads(lead.categories_interested or "[]")
        return {
            "customer_name": lead.name or lead.collected_name or "Customer",
            "products_interested": lead.last_category or "fashion products",
            "categories": ", ".join(categories) if categories else "general fashion",
            "price_range": lead.last_price_range or "not specified",
        }

    async def initiate_call(
        self, db: Session, lead: Lead, webhook_base_url: str
    ) -> CallLog | None:
        """Initiate an outbound call via Twilio connected to ElevenLabs agent."""
        if not self.twilio_available:
            logger.error("Twilio not configured — cannot initiate call")
            return None

        phone = lead.phone_number
        if not phone:
            logger.error("No phone number for lead %s", lead.chat_id)
            return None

        try:
            # Build ElevenLabs agent context
            context = self._build_agent_context(lead)
            status_callback_url = f"{webhook_base_url}/webhook/twilio/status"

            call_sid = ""
            conversation_id = None

            # PRIMARY: ElevenLabs Conversational AI outbound call
            if self.elevenlabs_available:
                async with httpx.AsyncClient() as client:
                    el_response = await client.post(
                        "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
                        headers={
                            "xi-api-key": settings.elevenlabs_api_key,
                            "Content-Type": "application/json",
                        },
                        json={
                            "agent_id": settings.elevenlabs_agent_id,
                            "agent_phone_number_id": settings.elevenlabs_phone_number_id,
                            "to_number": phone,
                            "conversation_initiation_client_data": {
                                "dynamic_variables": {
                                    "customer_name": context["customer_name"],
                                    "products_interested": context["products_interested"],
                                    "categories": context["categories"],
                                    "price_range": context["price_range"],
                                    "lead_chat_id": lead.chat_id,
                                }
                            },
                        },
                        timeout=30.0,
                    )
                    el_data = el_response.json()
                    call_sid = el_data.get("call_sid", el_data.get("callSid", ""))
                    conversation_id = el_data.get("conversation_id", "")

            else:
                # FALLBACK: Direct Twilio call with TwiML webhook
                call = self.twilio_client.calls.create(
                    to=phone,
                    from_=settings.twilio_phone_number,
                    url=f"{webhook_base_url}/webhook/twilio/twiml?chat_id={lead.chat_id}",
                    status_callback=status_callback_url,
                    status_callback_event=["initiated", "ringing", "answered", "completed"],
                    status_callback_method="POST",
                    timeout=30,
                )
                call_sid = call.sid
                conversation_id = None

            # Create call log
            call_log = CallLog(
                lead_id=lead.id,
                chat_id=lead.chat_id,
                call_sid=call_sid,
                phone_number=phone,
                status="initiated",
                elevenlabs_conversation_id=conversation_id,
                initiated_at=datetime.utcnow(),
            )
            db.add(call_log)

            # Update lead
            lead.call_status = "calling"
            lead.call_sid = call_sid
            lead.called_at = datetime.utcnow()
            db.commit()

            logger.info(
                "Call initiated: SID=%s to %s for lead %s",
                call_sid,
                phone,
                lead.chat_id,
            )
            return call_log

        except Exception as e:
            logger.exception("Failed to initiate call for lead %s: %s", lead.chat_id, e)
            lead.call_status = "failed"
            db.commit()
            return None

    def handle_twilio_status(
        self, db: Session, call_sid: str, status: str, duration: int = 0
    ) -> None:
        """Process Twilio call status webhook."""
        call_log = db.query(CallLog).filter(CallLog.call_sid == call_sid).first()
        if not call_log:
            logger.warning("CallLog not found for SID: %s", call_sid)
            return

        call_log.status = status
        if duration:
            call_log.duration = duration

        if status in ("completed", "failed", "busy", "no-answer", "canceled"):
            call_log.completed_at = datetime.utcnow()

        # Update lead call_status
        lead = db.query(Lead).filter(Lead.id == call_log.lead_id).first()
        if lead:
            if status == "completed":
                lead.call_status = "completed"
                lead.call_duration = duration
            elif status in ("failed", "busy", "no-answer", "canceled"):
                lead.call_status = "failed"

        db.commit()
        logger.info(
            "Call status updated: SID=%s status=%s duration=%s",
            call_sid,
            status,
            duration,
        )

    def handle_elevenlabs_post_call(
        self,
        db: Session,
        conversation_id: str,
        call_sid: str | None,
        transcript: str | None,
        collected_data: dict | None,
        summary: str | None,
        duration: int = 0,
        recording_url: str | None = None,
    ) -> None:
        """Process ElevenLabs post-call webhook data."""
        # Find call log by conversation_id first, fallback to call_sid
        call_log = None
        if conversation_id:
            call_log = (
                db.query(CallLog)
                .filter(CallLog.elevenlabs_conversation_id == conversation_id)
                .first()
            )
        if not call_log and call_sid:
            call_log = db.query(CallLog).filter(CallLog.call_sid == call_sid).first()

        if not call_log:
            logger.warning(
                "CallLog not found for conversation_id=%s call_sid=%s",
                conversation_id,
                call_sid,
            )
            return

        # Update call log
        call_log.transcript = transcript
        call_log.collected_data_json = json.dumps(collected_data) if collected_data else None
        call_log.status = "completed"
        call_log.duration = duration or call_log.duration
        call_log.completed_at = datetime.utcnow()

        # Update lead with collected data
        lead = db.query(Lead).filter(Lead.id == call_log.lead_id).first()
        if lead and collected_data:
            if collected_data.get("name"):
                lead.collected_name = collected_data["name"]
            if collected_data.get("address"):
                lead.collected_address = collected_data["address"]
            if collected_data.get("product_interest"):
                lead.collected_product_interest = collected_data["product_interest"]
            lead.call_summary = summary
            lead.call_status = "completed"
            lead.call_duration = duration
            lead.call_recording_url = recording_url

            # If customer said ready to buy, mark as converted
            if collected_data.get("ready_to_buy", "").lower() in ("yes", "haan", "ha"):
                lead.lead_status = "converted"

        db.commit()
        logger.info(
            "ElevenLabs post-call data saved: conversation=%s, collected=%s",
            conversation_id,
            collected_data,
        )

    async def send_post_call_followup(self, lead: Lead) -> None:
        """Send WhatsApp follow-up after the call completes."""
        if not lead.chat_id:
            return

        try:
            # Import inside method to avoid circular imports
            from app.services.assistant_messages import call_followup_message
            from app.services.hypersender_service import hypersender_service

            name = lead.collected_name or lead.name or "Customer"
            msg = call_followup_message(name, lead.collected_product_interest)
            await hypersender_service.send_text(lead.chat_id, msg)
            logger.info("Post-call followup sent to %s", lead.chat_id)
        except Exception as e:
            logger.warning("Failed to send post-call followup: %s", e)


calling_agent_service = CallingAgentService()
