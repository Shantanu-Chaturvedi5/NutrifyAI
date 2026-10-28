"use client";

import { useActionState, useEffect, useRef, useState, type PointerEvent } from "react";
import { uploadScanAction, type ActionState } from "@/lib/actions/product-scans";

const initialState: ActionState = {};

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function UploadScanForm() {
  const [state, formAction, pending] = useActionState(uploadScanAction, initialState);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Both the camera capture and the file picker feed into this shared
  // crop step before a photo is considered "final" — rawImageUrl/Blob
  // hold whatever was just captured/picked, pending the user either
  // cropping it or choosing to use it as-is.
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [rawImageBlob, setRawImageBlob] = useState<Blob | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const cropping = rawImageUrl !== null;

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function openCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError(
        "Couldn't access the camera — check your browser's camera permission for this site, or use \"Choose file\" instead."
      );
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setVideoReady(false);
    setCapturing(false);
  }

  function capturePhoto() {
    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setCameraError("Something went wrong setting up the capture — try reopening the camera.");
      setCapturing(false);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera isn't ready yet — give it a second and try again.");
      setCapturing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Something went wrong setting up the capture — try reopening the camera.");
      setCapturing(false);
      return;
    }
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error("ctx.drawImage threw:", err);
      setCameraError("Couldn't draw the camera frame — try again, or use \"Choose file\" instead.");
      setCapturing(false);
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          enterCropStep(blob);
          return;
        }
        // Some browsers' privacy/fingerprinting protections silently null
        // out toBlob after a canvas has had camera data drawn onto it —
        // toDataURL sometimes still works in that exact situation.
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          fetch(dataUrl)
            .then((res) => res.blob())
            .then(enterCropStep)
            .catch((err) => {
              console.error("toDataURL fallback failed:", err);
              setCameraError(
                "This browser is blocking photo capture from the camera — use \"Choose file\" instead, or try a different browser."
              );
              setCapturing(false);
            });
        } catch (err) {
          console.error("canvas.toDataURL threw:", err);
          setCameraError(
            "This browser is blocking photo capture from the camera — use \"Choose file\" instead, or try a different browser."
          );
          setCapturing(false);
        }
      },
      "image/jpeg",
      0.9
    );
  }

  function enterCropStep(blob: Blob) {
    setRawImageBlob(blob);
    setRawImageUrl(URL.createObjectURL(blob));
    setCropRect(null);
    setCapturing(false);
    closeCamera();
  }

  function handleFilePicked() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setPreviewUrl(null);
    enterCropStep(file);
  }

  // --- Crop selection (plain drag-to-select, no dependency needed) ---

  function handleCropPointerDown(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);
    dragStartRef.current = { x, y };
    setCropRect({ x, y, width: 0, height: 0 });
  }

  function handleCropPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width);
    const y = clamp(e.clientY - rect.top, 0, rect.height);
    const start = dragStartRef.current;
    setCropRect({
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    });
  }

  function handleCropPointerUp() {
    dragStartRef.current = null;
  }

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(n, max));
  }

  function applyCrop() {
    const img = cropImgRef.current;
    if (!img || !cropRect) return;

    if (cropRect.width < 15 || cropRect.height < 15) {
      setCameraError("That selection is too small — drag a bigger rectangle over the label, or use the full image instead.");
      return;
    }
    setCameraError(null);

    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cropRect.width * scaleX);
    canvas.height = Math.round(cropRect.height * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      cropRect.x * scaleX,
      cropRect.y * scaleY,
      cropRect.width * scaleX,
      cropRect.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          finalizeImage(blob);
          return;
        }
        // Same toBlob-blocked fallback as the camera capture path above.
        try {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          fetch(dataUrl).then((res) => res.blob()).then(finalizeImage);
        } catch (err) {
          console.error("Crop export failed:", err);
          setCameraError("Couldn't crop that image — try a different selection, or use the full image.");
        }
      },
      "image/jpeg",
      0.9
    );
  }

  function useFullImage() {
    if (rawImageBlob) finalizeImage(rawImageBlob);
  }

  function finalizeImage(blob: Blob) {
    if (!fileInputRef.current) {
      setCameraError("Something went wrong saving the photo — try again.");
      return;
    }
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });

    // The upload form (and the server action behind it) work off the file
    // input's native FormData entry — this DataTransfer trick makes a
    // captured/cropped photo look exactly like a user-picked file, so
    // nothing else in the upload flow needs to know how it got here.
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInputRef.current.files = dt.files;

    setPreviewUrl(URL.createObjectURL(blob));
    setRawImageUrl(null);
    setRawImageBlob(null);
    setCropRect(null);
  }

  function startOver() {
    setPreviewUrl(null);
    setRawImageUrl(null);
    setRawImageBlob(null);
    setCropRect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="file" className="mb-2 block text-sm font-semibold text-graphite">
          Photo of the nutrition or ingredients label
        </label>

        <input
          id="file"
          name="file"
          type="file"
          required={!previewUrl}
          accept=".jpg,.jpeg,.png,.pdf"
          ref={fileInputRef}
          onChange={handleFilePicked}
          className={
            cameraOpen || cropping
              ? "hidden"
              : "scan-file-input w-full rounded-2xl px-3 py-3 text-sm"
          }
        />

        {cameraOpen && !cropping && (
          <div className="mt-3 space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onLoadedMetadata={() => setVideoReady(true)}
              className="w-full rounded-2xl border border-hairline bg-black"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={capturing}
                className="scan-action rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {capturing ? "Capturing…" : "Capture photo"}
              </button>
              <button
                type="button"
                onClick={closeCamera}
                className="rounded-xl border border-hairline bg-card px-4 py-2 text-sm font-semibold text-graphite transition hover:bg-linen"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cropping && rawImageUrl && (
          <div className="mt-3 space-y-3">
            <p className="text-sm text-graphite-70">Drag over the label to crop, or use the full photo.</p>
            <div
              className="relative w-full touch-none select-none overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--scan-upload-border)" }}
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={rawImageUrl}
                alt="Uncropped photo"
                className="block w-full"
                draggable={false}
              />
              {cropRect && (
                <div
                  className="absolute border-2 border-[#39a0b7] bg-[#39a0b7]/20"
                  style={{
                    left: cropRect.x,
                    top: cropRect.y,
                    width: cropRect.width,
                    height: cropRect.height,
                  }}
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyCrop}
                disabled={!cropRect || cropRect.width < 15 || cropRect.height < 15}
                className="scan-action rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Apply crop
              </button>
              <button
                type="button"
                onClick={useFullImage}
                className="rounded-xl border border-hairline bg-card px-4 py-2 text-sm font-semibold text-graphite transition hover:bg-linen"
              >
                Use full image
              </button>
            </div>
          </div>
        )}

        {!cameraOpen && !cropping && previewUrl && (
          <div className="mt-3 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Selected label" className="max-h-56 rounded-2xl border border-hairline object-contain" />
            <button type="button" onClick={startOver} className="text-sm font-semibold underline underline-offset-2" style={{ color: "var(--scan-badge-text)" }}>
              Choose a different photo
            </button>
          </div>
        )}

        {!cameraOpen && !cropping && !previewUrl && (
          <button
            type="button"
            onClick={openCamera}
            className="mt-3 rounded-xl border px-4 py-2 text-sm font-semibold transition"
            style={{ borderColor: "var(--scan-upload-border)", backgroundColor: "var(--scan-badge-bg)", color: "var(--scan-badge-text)" }}
          >
            Or use your camera
          </button>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraError && (
        <p className="rounded-xl border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical">
          {cameraError}
        </p>
      )}

      {state.error && (
        <p className="rounded-xl border border-critical/40 bg-critical-soft px-3 py-2 text-sm text-critical">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || cameraOpen || cropping}
        className="scan-action rounded-xl px-5 py-3 font-semibold shadow-[0_8px_18px_rgba(35,109,128,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Analyze product"}
      </button>
    </form>
  );
}