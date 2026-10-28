"""
PaddleOCR wrapper. Accepts raw file bytes (PDF or image) and returns plain
text — one line per detected text region, page order preserved for PDFs.

The engine is loaded once per process (model files are ~10s of MB and
loading takes a couple of seconds) and reused across requests.
"""

import cv2
import fitz  # PyMuPDF
import numpy as np
from paddleocr import PaddleOCR

_engine: PaddleOCR | None = None


def _get_engine() -> PaddleOCR:
    global _engine
    if _engine is None:
        _engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _engine


def extract_text(file_bytes: bytes, content_type: str | None = None) -> str:
    is_pdf = (content_type == "application/pdf") or file_bytes[:4] == b"%PDF"

    lines: list[str] = []
    if is_pdf:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            pixmap = page.get_pixmap(matrix=_safe_render_matrix(page))
            lines.extend(_ocr_image_bytes(pixmap.tobytes("png")))
    else:
        lines.extend(_ocr_image_bytes(file_bytes))

    return "\n".join(lines)


# 200 DPI is the normal target — PDF points are 1/72 inch, so this is the
# scale factor for that. A PDF's declared page size is just metadata a
# malformed or unusual file can set to something absurd; rendering that
# blindly at a fixed DPI can produce an arbitrarily huge pixmap and exhaust
# memory regardless of any container limit. Cap the actual output pixels
# instead, scaling the DPI down for oversized pages rather than ever
# producing more than a fixed, safe number of pixels.
_TARGET_DPI = 200
_MAX_RENDER_PIXELS = 4000  # longest side, at most — generous for any real scanned page


def _safe_render_matrix(page) -> fitz.Matrix:
    scale = _TARGET_DPI / 72.0
    longest_side_pt = max(page.rect.width, page.rect.height)
    longest_side_px = longest_side_pt * scale
    if longest_side_px > _MAX_RENDER_PIXELS:
        scale = _MAX_RENDER_PIXELS / longest_side_pt
    return fitz.Matrix(scale, scale)


def _ocr_image_bytes(image_bytes: bytes) -> list[str]:
    engine = _get_engine()
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        return []

    result = engine.ocr(image, cls=True)
    lines: list[str] = []
    for block in result or []:
        for detection in block or []:
            text = detection[1][0]
            lines.append(text)
    return lines