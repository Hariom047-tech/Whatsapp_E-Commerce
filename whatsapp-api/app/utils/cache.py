"""TTL cache for frequent product searches."""

import hashlib
import json
from typing import Any

from cachetools import TTLCache

from app.config import get_settings

_settings = get_settings()
_search_cache: TTLCache = TTLCache(maxsize=500, ttl=_settings.cache_ttl_seconds)


def _cache_key(prefix: str, data: dict) -> str:
    raw = json.dumps(data, sort_keys=True, default=str)
    return f"{prefix}:{hashlib.md5(raw.encode()).hexdigest()}"


def get_cached(key: str) -> Any | None:
    return _search_cache.get(key)


def set_cached(key: str, value: Any) -> None:
    _search_cache[key] = value


def intent_cache_key(intent_dict: dict) -> str:
    return _cache_key("intent_search", intent_dict)
