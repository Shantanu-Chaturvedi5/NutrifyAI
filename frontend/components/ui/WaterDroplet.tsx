"use client";

import { useId } from "react";

const DROP_PATH =
  "M35 6 C35 6 10 42 10 60 C10 76 21 88 35 88 C49 88 60 76 60 60 C60 42 35 6 35 6 Z";
const CLIP_TOP = 6;
const CLIP_BOTTOM = 88;

export function WaterDroplet({
  value,
  max,
  color = "var(--sage)",
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const fillHeight = (CLIP_BOTTOM - CLIP_TOP) * pct;
  const fillY = CLIP_BOTTOM - fillHeight;
  // Unique per instance — without this, two WaterDroplets on the same
  // page would collide on the same hardcoded id, and every instance
  // after the first would silently render using the first one's clip.
  const clipId = `water-droplet-clip-${useId()}`;

  return (
    <div className="relative shrink-0" style={{ width: 70, height: 96 }}>
      <svg width="70" height="96" viewBox="0 0 70 96">
        <defs>
          <clipPath id={clipId}>
            <path d={DROP_PATH} />
          </clipPath>
        </defs>
        <rect x="0" y={fillY} width="70" height={96 - fillY} fill={color} clipPath={`url(#${clipId})`} />
        {fillHeight > 0 && (
          <rect x="0" y={fillY} width="70" height="3" fill="var(--card)" opacity="0.5" clipPath={`url(#${clipId})`} />
        )}
        <path d={DROP_PATH} fill="none" stroke={color} strokeWidth="2.5" />
      </svg>
      <div className="absolute inset-x-0 bottom-3.5 text-center font-display text-[15px] font-semibold text-graphite drop-shadow-xs">
        {Math.round(pct * 100)}%
      </div>
    </div>
  );
}