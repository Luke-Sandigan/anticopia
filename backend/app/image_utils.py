
import struct

import cv2
import numpy as np
from fastapi import HTTPException

from app.config import (
    MAX_DETECTION_DIMENSION,
    MAX_IMAGE_DIMENSION,
    MAX_IMAGE_PIXELS,
)


def image_dimensions(data: bytes) -> tuple[int, int] | None:
    # PNG: signature + IHDR + width/height.
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        if len(data) < 24 or data[12:16] != b"IHDR":
            return None
        return struct.unpack(">II", data[16:24])

    # JPEG: walk marker segments to find a Start Of Frame.
    if not data.startswith(b"\xff\xd8"):
        return None

    sof_markers = {
        0xC0, 0xC1, 0xC2, 0xC3,
        0xC5, 0xC6, 0xC7, 0xC9,
        0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
    }

    i = 2
    while i + 4 <= len(data):
        if data[i] != 0xFF:
            i += 1
            continue

        while i < len(data) and data[i] == 0xFF:
            i += 1
        if i >= len(data):
            break

        marker = data[i]
        i += 1

        if marker in {0xD8, 0xD9, 0x01} or 0xD0 <= marker <= 0xD7:
            continue

        if i + 2 > len(data):
            break

        segment_length = int.from_bytes(data[i:i + 2], "big")
        if segment_length < 2 or i + segment_length > len(data):
            break

        if marker in sof_markers:
            if segment_length < 7:
                return None
            height, width = struct.unpack(">HH", data[i + 3:i + 7])
            return width, height

        if marker == 0xDA:  # Start Of Scan
            break

        i += segment_length

    return None


def decode_for_detection(data: bytes) -> np.ndarray:
    dimensions = image_dimensions(data)
    if dimensions is None:
        raise HTTPException(
            status_code=400,
            detail="Only valid JPEG or PNG images are supported",
        )

    width, height = dimensions
    if (
        width < 1
        or height < 1
        or width > MAX_IMAGE_DIMENSION
        or height > MAX_IMAGE_DIMENSION
        or width * height > MAX_IMAGE_PIXELS
    ):
        raise HTTPException(
            status_code=413,
            detail="Image dimensions exceed the allowed limit",
        )

    encoded = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(encoded, cv2.IMREAD_GRAYSCALE)
    del encoded

    if frame is None:
        raise HTTPException(
            status_code=400,
            detail="Image could not be decoded",
        )

    height, width = frame.shape
    scale = min(
        1.0,
        MAX_DETECTION_DIMENSION / max(height, width),
    )

    if scale < 1.0:
        resized = cv2.resize(
            frame,
            (
                max(1, int(width * scale)),
                max(1, int(height * scale)),
            ),
            interpolation=cv2.INTER_AREA,
        )
        del frame
        frame = resized

    return frame
