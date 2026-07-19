"""Lead management, admin API, and calling agent webhook endpoints."""

import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database.connection import get_db
from app.models.call_log import CallLog
from app.models.lead import Lead
from app.schemas.lead import (
    CallLogOut,
    LeadListResponse,
    LeadOut,
    LeadStatsResponse,
)
from app.services.calling_agent_service import calling_agent_service
from app.services.lead_scoring_service import lead_scoring_service
from app.utils.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["Leads"])
settings = get_settings()


# ─── Admin API ───────────────────────────────────────────────


@router.get("/api/leads", response_model=LeadListResponse, summary="List all leads")
async def list_leads(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.lead_status == status)
    total = query.count()
    leads = query.order_by(Lead.lead_score.desc()).offset(offset).limit(limit).all()
    return LeadListResponse(total=total, leads=[LeadOut.model_validate(l) for l in leads])


@router.get("/api/leads/hot", response_model=LeadListResponse, summary="Get hot leads")
async def hot_leads(db: Session = Depends(get_db)):
    leads = (
        db.query(Lead)
        .filter(Lead.lead_status == "hot")
        .order_by(Lead.lead_score.desc())
        .all()
    )
    return LeadListResponse(total=len(leads), leads=[LeadOut.model_validate(l) for l in leads])


@router.get("/api/leads/stats", response_model=LeadStatsResponse, summary="Lead statistics")
async def lead_stats(db: Session = Depends(get_db)):
    total = db.query(Lead).count()
    cold = db.query(Lead).filter(Lead.lead_status == "cold").count()
    warm = db.query(Lead).filter(Lead.lead_status == "warm").count()
    hot = db.query(Lead).filter(Lead.lead_status == "hot").count()
    calls = db.query(CallLog).count()
    completed = db.query(CallLog).filter(CallLog.status == "completed").count()
    converted = db.query(Lead).filter(Lead.lead_status == "converted").count()
    return LeadStatsResponse(
        total_leads=total,
        cold_leads=cold,
        warm_leads=warm,
        hot_leads=hot,
        calls_made=calls,
        calls_completed=completed,
        converted=converted,
    )


@router.get("/api/leads/{chat_id}", response_model=LeadOut, summary="Get lead details")
async def get_lead(chat_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.chat_id == chat_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return LeadOut.model_validate(lead)


@router.get("/api/leads/{chat_id}/calls", summary="Get call history for a lead")
async def get_lead_calls(chat_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(CallLog)
        .filter(CallLog.chat_id == chat_id)
        .order_by(CallLog.initiated_at.desc())
        .all()
    )
    return [CallLogOut.model_validate(log) for log in logs]


@router.post("/api/leads/{chat_id}/call", summary="Manually trigger a call")
async def trigger_call(chat_id: str, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.chat_id == chat_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.call_status == "calling":
        raise HTTPException(status_code=409, detail="Call already in progress")

    webhook_base_url = settings.public_website_base_url or settings.webhook_base_url
    call_log = await calling_agent_service.initiate_call(db, lead, webhook_base_url)
    if not call_log:
        raise HTTPException(status_code=500, detail="Failed to initiate call")

    return {"status": "call_initiated", "call_sid": call_log.call_sid}


# ─── Twilio Status Webhook ──────────────────────────────────


@router.post("/webhook/twilio/status", summary="Twilio call status callback")
async def twilio_status_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Twilio sends form-encoded status updates."""
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "")
    status = form_data.get("CallStatus", "")
    duration = int(form_data.get("CallDuration", "0") or "0")

    logger.info("Twilio status: SID=%s status=%s duration=%s", call_sid, status, duration)

    if call_sid:
        calling_agent_service.handle_twilio_status(db, call_sid, status, duration)

        # If call completed, send follow-up WhatsApp message
        if status == "completed":
            call_log = db.query(CallLog).filter(CallLog.call_sid == call_sid).first()
            if call_log:
                lead = db.query(Lead).filter(Lead.id == call_log.lead_id).first()
                if lead:
                    await calling_agent_service.send_post_call_followup(lead)

    return {"status": "ok"}


# ─── ElevenLabs Post-Call Webhook ────────────────────────────


@router.post("/webhook/elevenlabs", summary="ElevenLabs post-call data webhook")
async def elevenlabs_webhook(request: Request, db: Session = Depends(get_db)):
    """Receives call results from ElevenLabs after conversation ends."""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    logger.info("ElevenLabs webhook received: %s", json.dumps(payload)[:500])

    # Parse flexibly — ElevenLabs webhook format can vary
    conversation_id = payload.get("conversation_id", payload.get("conversationId", ""))
    call_sid = payload.get("call_sid", payload.get("callSid", ""))
    transcript = payload.get("transcript", "")
    collected_data = (
        payload.get("collected_data")
        or payload.get("data_collected")
        or payload.get("analysis", {}).get("data_collection", {})
    )
    summary = (
        payload.get("summary")
        or payload.get("analysis", {}).get("call_summary", "")
    )
    duration = (
        payload.get("call_duration_secs")
        or payload.get("metadata", {}).get("call_duration_secs", 0)
    )
    recording_url = (
        payload.get("recording_url")
        or payload.get("metadata", {}).get("recording_url", "")
    )

    if conversation_id or call_sid:
        calling_agent_service.handle_elevenlabs_post_call(
            db=db,
            conversation_id=conversation_id,
            call_sid=call_sid,
            transcript=transcript,
            collected_data=collected_data,
            summary=summary,
            duration=duration,
            recording_url=recording_url,
        )

        # Send follow-up WhatsApp message
        call_log = None
        if conversation_id:
            call_log = (
                db.query(CallLog)
                .filter(CallLog.elevenlabs_conversation_id == conversation_id)
                .first()
            )
        if not call_log and call_sid:
            call_log = db.query(CallLog).filter(CallLog.call_sid == call_sid).first()
        if call_log:
            lead = db.query(Lead).filter(Lead.id == call_log.lead_id).first()
            if lead:
                await calling_agent_service.send_post_call_followup(lead)

    return {"status": "ok"}
