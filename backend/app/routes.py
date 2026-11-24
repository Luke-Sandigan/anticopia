
import asyncio
from datetime import datetime, timezone
from typing import Literal

from fastapi import (
    APIRouter,
    File,
    Form,
    Header,
    HTTPException,
    UploadFile,
)

from app.config import (
    APP_VERSION,
    INFERENCE_WAIT_SECONDS,
    MAX_CONCURRENT_INFERENCES,
    MAX_UPLOAD_BYTES,
)
from app.detector import detect_faces
from app.schemas import DetectionResponse
from app.security import require_api_key

router = APIRouter()
inference_slots = asyncio.Semaphore(MAX_CONCURRENT_INFERENCES)


@router.get("/health")
def health():
    return {"status": "ok", "version": APP_VERSION}


@router.post("/v1/detect", response_model=DetectionResponse)
async def detect(
    image: UploadFile = File(...),
    source: Literal["webcam", "screenshot"] = Form(...),
    consent_confirmed: bool = Form(...),
    x_api_key: str | None = Header(default=None),
):
    require_api_key(x_api_key)

    if not consent_confirmed:
        raise HTTPException(
            status_code=403,
            detail="Consent is required before processing",
        )

    if image.content_type not in {"image/jpeg", "image/png"}:
        await image.close()
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG or PNG image",
        )

    try:
        image_bytes = await image.read(MAX_UPLOAD_BYTES + 1)
    finally:
        await image.close()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image upload exceeds 2 MB",
        )

    acquired = False
    try:
        try:
            await asyncio.wait_for(
                inference_slots.acquire(),
                timeout=INFERENCE_WAIT_SECONDS,
            )
            acquired = True
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=503,
                detail="Detector is busy; retry shortly",
                headers={"Retry-After": "1"},
            )

        face_count = await asyncio.to_thread(
            detect_faces,
            image_bytes,
        )
    finally:
        if acquired:
            inference_slots.release()
        del image_bytes

    if face_count == 0:
        event_type = "face_not_detected"
        note = "No face detected; check camera framing and lighting."
    elif face_count == 1:
        event_type = "face_detected"
        note = "One face detected."
    else:
        event_type = "multiple_faces_detected"
        note = "Multiple faces detected; human review may be needed."

    return DetectionResponse(
        event_type=event_type,
        face_count=face_count,
        timestamp=datetime.now(timezone.utc).isoformat(),
        model_version=APP_VERSION,
        note=f"{source}: {note}",
    )
