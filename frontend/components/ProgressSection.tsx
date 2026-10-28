"use client";

import { useState } from "react";

export type HistoryPoint = { label: string; value: number; date: string };

function LineChart({
  data,
  colorVar,
  unit,
}: {
  data: HistoryPoint[];
  colorVar: string;
  unit: string;
}) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const W = 400, H = 130, padL = 32, padR = 10, padT = 10, padB = 20;
  const vMin = Math.min(...data.map((d) => d.value)) - 1;
  const vMax = Math.max(...data.map((d) => d.value)) + 1;
  const xs = data.map((_, i) => padL + (i / (data.length - 1)) * (W - padL - padR));
  const ys = data.map((d) => padT + (1 - (d.value - vMin) / (vMax - vMin || 1)) * (H - padT - padB));
  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full overflow-visible">
        {[0, 1, 2].map((i) => {
          const y = padT + (i / 2) * (H - padT - padB);
          const val = vMax - (i / 2) * (vMax - vMin);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} className="stroke-hairline" strokeWidth="1" />
              <text x="2" y={y + 3} className="fill-graphite-45 font-data text-[9px]">
                {val.toFixed(1)}
              </text>
            </g>
          );
        })}
        <path
          d={`${pathD} L${xs[xs.length - 1].toFixed(1)} ${H - padB} L${xs[0].toFixed(1)} ${H - padB} Z`}
          fill={colorVar}
          opacity="0.12"
        />
        <path d={pathD} fill="none" stroke={colorVar} strokeWidth="2" />
        {data.map((d, i) => (
          <circle
            key={i}
            cx={xs[i]}
            cy={ys[i]}
            r={hover?.text.startsWith(d.label) ? 5 : 3.5}
            fill={colorVar}
            stroke="var(--linen)"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setHover({ x: xs[i], y: ys[i], text: `${d.label} · ${d.value}${unit}` })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {data.map((d, i) =>
          i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? (
            <text key={i} x={xs[i]} y={H - 4} textAnchor="middle" className="fill-graphite-45 font-data text-[9px]">
              {d.label}
            </text>
          ) : null
        )}
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-lg bg-graphite px-2 py-1 font-data text-[11px] text-linen"
          style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
}

function MetricColumn({
  label,
  unit,
  history,
}: {
  label: string;
  unit: string;
  history: HistoryPoint[];
}) {
  if (history.length === 0) {
    return (
      <div className="px-5 py-7 text-center">
        <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-linen-deep text-graphite-45">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 14l4-4 3 3 5-6" />
          </svg>
        </div>
        <p className="mb-1 text-sm font-semibold text-graphite">No {label.toLowerCase()} data yet</p>
        <p className="text-xs text-graphite-45">Update your profile to start tracking</p>
      </div>
    );
  }

  if (history.length === 1) {
    const only = history[0];
    return (
      <div className="flex items-center gap-4 p-5">
        <div>
          <div className="font-data text-[10px] uppercase tracking-wide text-graphite-45">Current</div>
          <div className="font-data text-2xl font-bold text-graphite">
            {only.value}
            {unit}
          </div>
        </div>
        <div className="flex-1 border-l-2 border-dashed border-hairline pl-3.5 text-xs text-graphite-45">
          Logged once ({only.label}) — update again to see a trend
        </div>
      </div>
    );
  }

  const current = history[history.length - 1].value;
  const change = current - history[0].value;
  return (
    <div className="p-5">
      <div className="mb-2 flex gap-5">
        <div>
          <div className="font-data text-[10px] uppercase tracking-wide text-graphite-45">Current</div>
          <div className="font-data text-lg font-bold text-graphite">
            {current}
            {unit}
          </div>
        </div>
        <div>
          <div className="font-data text-[10px] uppercase tracking-wide text-graphite-45">Change</div>
          <div className={`font-data text-lg font-bold ${change <= 0 ? "text-sage" : "text-garnet"}`}>
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}
            {unit}
          </div>
        </div>
      </div>
      <LineChart data={history} colorVar={unit === "kg" ? "var(--sage)" : "var(--saffron)"} unit={unit} />
    </div>
  );
}

export function ProgressSection({
  weightHistory,
  bmiHistory,
}: {
  weightHistory: HistoryPoint[];
  bmiHistory: HistoryPoint[];
}) {
  return (
    <div className="mb-12 mt-9">
      <div className="mb-1 flex items-baseline justify-between border-b-2 border-graphite pb-2">
        <span className="font-display text-lg font-black uppercase tracking-tight">Your progress</span>
      </div>
      <div className="grid sm:grid-cols-2">
        <div className="border-b border-hairline sm:border-b-0 sm:border-r sm:border-hairline">
          <div className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-graphite-70">Weight</div>
          <MetricColumn label="Weight" unit="kg" history={weightHistory} />
        </div>
        <div>
          <div className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-graphite-70">BMI</div>
          <MetricColumn label="BMI" unit="" history={bmiHistory} />
        </div>
      </div>
    </div>
  );
}