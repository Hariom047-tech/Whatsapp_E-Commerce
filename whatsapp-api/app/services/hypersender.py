"""Backward-compatible re-export — use hypersender_service.py."""

from app.services.hypersender_service import HyperSenderService, hypersender_service

__all__ = ["HyperSenderService", "hypersender_service"]
