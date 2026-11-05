from typing import Literal

from pydantic import BaseModel


class DetectionResponse(BaseModel):
    event_type: Literal[
        "face_detected",
        "face_not_detected",
        "multiple_faces_detected",
    ]
    face_count: int
    timestamp: str
    model_version: str
    note: str
