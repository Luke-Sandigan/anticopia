import cv2

from app.image_utils import decode_for_detection

cv2.setNumThreads(1)

_CASCADE_PATH = (
    cv2.data.haarcascades
    + "haarcascade_frontalface_default.xml"
)

_face_detector = cv2.CascadeClassifier(_CASCADE_PATH)

if _face_detector.empty():
    raise RuntimeError("Could not load OpenCV face cascade")


def detect_faces(image_bytes: bytes) -> int:
    frame = decode_for_detection(image_bytes)

    faces = _face_detector.detectMultiScale(
        frame,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30),
    )

    count = len(faces)

    del faces, frame
    return count
