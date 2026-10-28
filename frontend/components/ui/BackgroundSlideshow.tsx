"use client";

import { useEffect, useState } from "react";

// The 4 photos verified earlier as genuinely free-to-use under the
// Unsplash License (not Unsplash+) — same ones used in the static
// design preview, now wired into the real app. Requesting a wide
// resolution (2400px) matters here — this renders full-bleed across
// the whole viewport, and a narrower source image stretched that wide
// visibly blurs.
const PHOTOS = [
  "https://images.unsplash.com/photo-1623428188495-89c064ee061a?auto=format&fit=crop&w=2400&q=80", // quinoa/kale bowl — Sonny Mauricio
  "https://images.unsplash.com/photo-1514537099923-4c0fc7c73161?auto=format&fit=crop&w=2400&q=80", // green salad — Vinn Koonyosying
  "https://images.unsplash.com/photo-1778449303540-3274878cdc85?auto=format&fit=crop&w=2400&q=80", // golden milk — Shoeib Abolhassani
  "https://images.unsplash.com/photo-1729368628910-2d58db8657a6?auto=format&fit=crop&w=2400&q=80", // berries — Tehzeeb Kazmi
];

/**
 * Auto-rotating background photo, full-bleed across the whole hero —
 * no flat opaque block anywhere. The photo is visible at every point
 * across the width; the scrim just tints it more heavily on the left
 * (where the headline sits) and fades to a light touch on the right,
 * using color-mix so it's a translucent wash rather than a solid
 * panel. That keeps a readable zone behind the text without ever
 * fully hiding the image.
 */
export function BackgroundSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % PHOTOS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PHOTOS.map((url, i) => (
        <div
          key={url}
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url('${url}')`,
            backgroundPosition: "75% center",
            opacity: i === active ? 1 : 0,
            transition: "opacity 2.4s ease-in-out",
          }}
        />
      ))}
      {/* Translucent left-to-right wash — photo stays visible everywhere,
          just increasingly tinted toward the text side. Strengthened
          from the first pass: some source photos (bright, busy ones
          like the golden milk shot) still washed out dark text even
          at 88%, so the text-side zone now goes heavier and holds
          longer before fading, and text itself also carries a soft
          halo shadow (see dashboard hero) as a second line of defense
          that isn't dependent on tuning this gradient per-photo. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--linen) 96%, transparent) 0%, color-mix(in srgb, var(--linen) 82%, transparent) 30%, color-mix(in srgb, var(--linen) 40%, transparent) 58%, transparent 88%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 82% at 14% 38%, color-mix(in srgb, var(--garnet) 24%, transparent), transparent 72%), radial-gradient(ellipse 46% 64% at 0% 18%, rgba(255, 157, 125, 0.3), transparent 76%), radial-gradient(ellipse 38% 48% at 42% 100%, rgba(235, 116, 138, 0.16), transparent 78%)",
        }}
      />
      {/* Top fade for navbar & soft bottom fade into var(--linen) to eliminate any hard cutoff */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--linen) 60%, transparent) 0%, transparent 12%, transparent 75%, var(--linen) 100%)",
        }}
      />
    </div>
  );
}