FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# PaddleOCR downloads its model files to $HOME on first run — give the
# non-root user a real home directory it can write to, or that download
# fails silently into a permissions error the first time OCR actually runs.
# Pre-creating ~/.paddleocr here (owned by app:app) matters specifically
# because it's now a mounted named volume (paddleocr_models, so models
# persist across restarts instead of re-downloading every time) — a fresh
# named volume defaults to root ownership unless the mount path already
# has correctly-owned content in the image for Docker to copy from.
#
# Fixed uid/gid (1500) so this matches backend-core's non-root user —
# they share the local_uploads Docker volume (see docker-compose.yml) as
# a fallback for local dev without real S3 credentials, and whichever
# container initializes that volume first determines its ownership.
RUN addgroup --system --gid 1500 app && adduser --system --uid 1500 --ingroup app --home /home/app app \
    && mkdir -p /app/data/uploads /home/app/.paddleocr \
    && chown -R app:app /app /home/app
ENV HOME=/home/app
USER app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]