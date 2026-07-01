"""Parse HyperSender webhook payloads into normalized messages."""

from typing import Any

from app.schemas.whatsapp import IncomingMessage
from app.utils.logging import get_logger

logger = get_logger(__name__)

MESSAGE_EVENTS = frozenset(
    {
        "message.any",
        "messages.any",
        "messages.upsert",
        "message",
        "messages",
    }
)


def _dig(data: Any, *keys: str) -> Any:
    current = data
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _find_first(data: Any, keys: set[str], max_depth: int = 6) -> Any:
    """Depth-first search for the first occurrence of any key in `keys`."""
    if max_depth < 0:
        return None
    if isinstance(data, dict):
        for k, v in data.items():
            if k in keys and v is not None:
                return v
        for v in data.values():
            found = _find_first(v, keys, max_depth=max_depth - 1)
            if found is not None:
                return found
    elif isinstance(data, list):
        for item in data:
            found = _find_first(item, keys, max_depth=max_depth - 1)
            if found is not None:
                return found
    return None


def _collect_values(data: Any, keys: set[str], max_depth: int = 8) -> list[Any]:
    """Collect all values for matching keys within nested dict/list payloads."""
    out: list[Any] = []
    if max_depth < 0:
        return out
    if isinstance(data, dict):
        for k, v in data.items():
            if k in keys and v is not None:
                out.append(v)
        for v in data.values():
            out.extend(_collect_values(v, keys, max_depth=max_depth - 1))
    elif isinstance(data, list):
        for item in data:
            out.extend(_collect_values(item, keys, max_depth=max_depth - 1))
    return out


def _looks_like_wa_jid(value: str) -> bool:
    v = value.strip().lower()
    if not v:
        return False
    if v.endswith("@c.us") or v.endswith("@s.whatsapp.net"):
        # must start with digits (optionally with leading +)
        num = v.split("@", 1)[0].lstrip("+")
        return num.isdigit() and len(num) >= 10
    return False


def _pick_best_chat_id(candidates: list[Any]) -> str | None:
    """Prefer real WhatsApp JIDs over internal ids like `@lid`."""
    strs = [str(c).strip() for c in candidates if c is not None and str(c).strip()]
    if not strs:
        return None

    # Prefer explicit WhatsApp JIDs
    wa = [s for s in strs if _looks_like_wa_jid(s)]
    if wa:
        # Prefer `@c.us` (send format) over `@s.whatsapp.net` (receive format)
        wa_sorted = sorted(
            wa,
            key=lambda s: (0 if s.lower().endswith("@c.us") else 1, len(s)),
        )
        return wa_sorted[0]

    # Fallback: anything that isn't clearly internal `@lid`
    non_lid = [s for s in strs if not s.lower().endswith("@lid")]
    return non_lid[0] if non_lid else strs[0]


def _normalize_chat_id(chat_id: str) -> str:
    """
    Normalize chat id for HyperSender send API.
    Keep `@lid` as-is — converting lid→c.us breaks replies on linked-device chats.
    """
    chat_id = chat_id.strip()
    if chat_id.endswith("@s.whatsapp.net"):
        return chat_id.replace("@s.whatsapp.net", "@c.us")
    if chat_id.endswith("@lid"):
        return chat_id
    if "@" not in chat_id and chat_id.replace("+", "").isdigit():
        return f"{chat_id.lstrip('+')}@c.us"
    return chat_id


def _unwrap_data(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Normalize HyperSender event wrapper into a single message dict."""
    raw = payload.get("data") or payload.get("payload") or payload

    if isinstance(raw, list):
        raw = raw[0] if raw else None
    if not isinstance(raw, dict):
        return None

    # HyperSender v2 nests the WhatsApp message under data.payload
    inner = raw.get("payload")
    if isinstance(inner, dict):
        # Some HyperSender payloads have an additional `payload.data` layer.
        nested = inner.get("data")
        if isinstance(nested, dict):
            return {**raw, **inner, **nested}
        return {**raw, **inner}

    # Some events nest the message under `payload.payload`
    inner = _dig(raw, "payload", "payload")
    if isinstance(inner, dict):
        return {**raw, **inner}

    # Some engines wrap Baileys payload in `_data`
    inner = raw.get("_data")
    if isinstance(inner, dict):
        merged = {**raw, **inner}
        merged.pop("_data", None)
        return merged

    return raw


def _extract_text(data: dict[str, Any], payload: dict[str, Any]) -> str:
    message_obj = _dig(data, "message") or _dig(data, "Message") or data
    text = (
        _dig(message_obj, "conversation")
        or _dig(message_obj, "extendedTextMessage", "text")
        or _dig(message_obj, "imageMessage", "caption")
        or _dig(message_obj, "videoMessage", "caption")
        or _dig(message_obj, "buttonsResponseMessage", "selectedDisplayText")
        or _dig(message_obj, "listResponseMessage", "title")
        or data.get("body")
        or data.get("text")
        or _dig(data, "_data", "Message", "conversation")
        or payload.get("text")
        or ""
    )
    return str(text).strip()


def _resolve_reply_chat_id(data: dict[str, Any], candidates: list[Any]) -> str | None:
    """
  HyperSender linked-device chats use `@lid` in `from` for replies.
  Prefer that over SenderAlt phone JIDs found deeper in the payload.
    """
    from_field = data.get("from")
    if isinstance(from_field, str) and from_field.strip().endswith("@lid"):
        return from_field.strip()

    chat_field = _dig(data, "_data", "Info", "Chat")
    if isinstance(chat_field, str) and chat_field.strip().endswith("@lid"):
        return chat_field.strip()

    return _pick_best_chat_id(candidates)


def parse_incoming_message(payload: dict[str, Any]) -> IncomingMessage | None:
    """
    Parse HyperSender message.any / messages.upsert style payloads.
    Supports HyperSender `_data` wrapper, Baileys keys, and WAHA-style `from`/`body`.
    """
    event = str(payload.get("event") or "").lower()
    if event and event not in MESSAGE_EVENTS:
        return None

    data = _unwrap_data(payload)
    if not data:
        return None

    from_me_val = (
        data.get("fromMe")
        or _dig(data, "key", "fromMe")
        or payload.get("fromMe")
        or _find_first(data, {"fromMe"}, max_depth=6)
    )
    from_me = bool(from_me_val)
    if from_me:
        return None

    direct_candidates = [
        data.get("from"),
        _dig(data, "key", "remoteJid"),
        data.get("remoteJid"),
        data.get("chatId"),
        payload.get("chatId"),
    ]
    deep_candidates = _collect_values(
        data, {"remoteJid", "chatId", "from", "jid", "SenderAlt", "Chat"}, max_depth=12
    )
    chat_id = _resolve_reply_chat_id(data, direct_candidates + deep_candidates)
    if not chat_id:
        logger.warning(
            "Webhook missing chat_id (event=%s, data_keys=%s)",
            event or "unknown",
            list(data.keys())[:12],
        )
        return None

    text = _extract_text(data, payload)
    if not text:
        logger.debug("Ignoring non-text message from %s", chat_id)
        return None

    message_id = _dig(data, "key", "id") or data.get("id")
    push_name = data.get("pushName") or payload.get("pushName")

    return IncomingMessage(
        chat_id=_normalize_chat_id(str(chat_id)),
        message_id=str(message_id) if message_id else None,
        text=text,
        from_me=from_me,
        sender_name=push_name,
    )
