"""HyperSender WhatsApp API v2 — production messaging service."""

from __future__ import annotations

import asyncio

import httpx
from tenacity import RetryError, retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.schemas.whatsapp import HyperSenderLinkPreviewPayload
from app.utils.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


def _guess_mimetype(url: str) -> str:
    u = (url or "").lower()
    if ".png" in u or "fm=png" in u:
        return "image/png"
    if ".webp" in u or "fm=webp" in u:
        return "image/webp"
    if ".gif" in u or "fm=gif" in u:
        return "image/gif"
    return "image/jpeg"


def _guess_filename(url: str) -> str:
    u = (url or "").lower()
    if ".png" in u or "fm=png" in u:
        return "product.png"
    if ".webp" in u or "fm=webp" in u:
        return "product.webp"
    return "product.jpg"


class HyperSenderService:
    """Low-level HyperSender API client with queue-aware sequential delivery."""

    def __init__(self) -> None:
        self.base_url = settings.hypersender_base_url.rstrip("/")
        self.instance_id = settings.hypersender_instance_id
        self.api_key = settings.hypersender_api_key
        self.json_headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.instance_id)

    def _endpoint(self, name: str) -> str:
        return f"{self.base_url}/{self.instance_id}/{name}"

    async def _wait_queued(self, response: dict, label: str = "request") -> dict:
        """Block until HyperSender finishes processing a queued request."""
        if not response.get("queued"):
            return response

        uuid = response.get("queued_request_uuid")
        if not uuid:
            await asyncio.sleep(1.5)
            return response

        url = self._endpoint(f"queued-requests/{uuid}")
        headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}

        for attempt in range(20):
            await asyncio.sleep(1.0 if attempt == 0 else 0.8)
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    poll = await client.get(url, headers=headers)
                    poll.raise_for_status()
                    data = poll.json()
            except Exception as exc:
                logger.debug("Queue poll %s attempt %s failed: %s", label, attempt + 1, exc)
                continue

            status = data.get("response_status")
            if status is None:
                continue

            if int(status) >= 400:
                logger.error("Queued %s failed (%s): %s", label, status, data.get("response_body"))
                raise RuntimeError(f"HyperSender queued {label} failed with status {status}")
            logger.info("Queued %s completed (status=%s)", label, status)
            return data

        logger.warning("Queued %s timed out (uuid=%s)", label, uuid)
        return response

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
    async def _post_json(self, endpoint: str, payload: dict, wait: bool = True) -> dict:
        return await self._execute_post(endpoint, payload, wait)

    async def _execute_post(self, endpoint: str, payload: dict, wait: bool = True) -> dict:
        if not self.configured:
            logger.warning("HyperSender not configured — mock send (%s)", endpoint)
            return {"queued": False, "mock": True}

        logger.info("HyperSender POST %s → chatId=%s", endpoint, payload.get("chatId", "?"))
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self._endpoint(endpoint), json=payload, headers=self.json_headers
            )
            if response.status_code >= 400:
                try:
                    body = response.json()
                except Exception:
                    body = response.text
                logger.error("HyperSender %s failed %s: %s", endpoint, response.status_code, body)
            response.raise_for_status()
            data = response.json()

        if wait:
            data = await self._wait_queued(data, endpoint)
        return data

    async def send_clickable_link_card(
        self, chat_id: str, payload: HyperSenderLinkPreviewPayload
    ) -> dict:
        """Send label + tapable link only (no extra description text)."""
        text = f"{payload.preview_title}\n{payload.preview_url}"
        return await self.send_text_with_link_preview(chat_id, text)

    async def _post_multipart(
        self, endpoint: str, data: dict, file_field: tuple[str, bytes, str], wait: bool = True
    ) -> dict:
        if not self.configured:
            return {"queued": False, "mock": True}

        filename, content, mimetype = file_field
        headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}
        form_data = {k: str(v) for k, v in data.items() if v is not None}

        logger.info("HyperSender multipart POST %s → chatId=%s", endpoint, data.get("chatId"))
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self._endpoint(endpoint),
                data=form_data,
                files={"file": (filename, content, mimetype)},
                headers=headers,
            )
            if response.status_code >= 400:
                try:
                    body = response.json()
                except Exception:
                    body = response.text
                logger.error("HyperSender %s multipart failed %s: %s", endpoint, response.status_code, body)
            response.raise_for_status()
            result = response.json()

        if wait:
            result = await self._wait_queued(result, endpoint)
        return result

    async def download_image(self, image_url: str) -> tuple[bytes, str, str] | None:
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "image/jpeg").split(";")[0].strip()
                if not content_type.startswith("image/"):
                    content_type = _guess_mimetype(image_url)
                return response.content, _guess_filename(image_url), content_type
        except Exception as exc:
            logger.warning("Image download failed %s: %s", image_url[:80], exc)
            return None

    async def send_text(self, chat_id: str, text: str, reply_to: str | None = None) -> dict:
        payload: dict = {"chatId": chat_id, "text": text, "link_preview": False}
        if reply_to:
            payload["reply_to"] = reply_to
        return await self._post_json("send-text-safe", payload)

    async def send_text_with_link_preview(
        self, chat_id: str, text: str, reply_to: str | None = None
    ) -> dict:
        payload: dict = {
            "chatId": chat_id,
            "text": text,
            "link_preview": True,
            "link_preview_high_quality": True,
        }
        if reply_to:
            payload["reply_to"] = reply_to
        return await self._post_json("send-text-safe", payload)

    async def send_image_with_caption(
        self,
        chat_id: str,
        image_url: str,
        caption: str,
        reply_to: str | None = None,
    ) -> dict:
        """Send product image + caption. Prefers file upload (works on trial plans)."""
        downloaded = await self.download_image(image_url)
        if downloaded:
            image_bytes, filename, mimetype = downloaded
            data: dict = {
                "chatId": chat_id,
                "fileName": filename,
                "mimetype": "image",
                "caption": caption,
            }
            if reply_to:
                data["reply_to"] = reply_to
            try:
                return await self._post_multipart("send-image", data, (filename, image_bytes, mimetype))
            except httpx.HTTPStatusError as exc:
                logger.warning("send-image (file) failed: %s", exc.response.status_code)

        payload = {
            "chatId": chat_id,
            "url": image_url,
            "fileName": _guess_filename(image_url),
            "caption": caption,
            "mimetype": "image",
        }
        if reply_to:
            payload["reply_to"] = reply_to
        try:
            return await self._post_json("send-image", payload)
        except (httpx.HTTPStatusError, RetryError) as exc:
            logger.warning("send-image (url) failed: %s", exc)
            raise

    async def start_typing(self, chat_id: str) -> None:
        if not self.configured:
            return
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    self._endpoint("start-typing"),
                    json={"chatId": chat_id},
                    headers=self.json_headers,
                )
        except Exception as exc:
            logger.debug("start-typing failed: %s", exc)

    async def stop_typing(self, chat_id: str) -> None:
        if not self.configured:
            return
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    self._endpoint("stop-typing"),
                    json={"chatId": chat_id},
                    headers=self.json_headers,
                )
        except Exception as exc:
            logger.debug("stop-typing failed: %s", exc)


hypersender_service = HyperSenderService()
