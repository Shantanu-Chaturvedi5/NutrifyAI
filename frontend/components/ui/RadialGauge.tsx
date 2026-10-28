const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RadialGauge({
  value,
  max,
  label,
  color = "var(--sage)",
  size = 118,
}: {
  /** Current amount (e.g. consumed calories, or a 0-100 score). */
  value: number;
  /** The value that represents a full ring. For a 0-100 score, pass 100. */
  max: number;
  /** Short text centered under the number, e.g. "SCORE" or omit for none. */
  label?: string;
  /** Any CSS color, including a var(--token) reference. */
  color?: string;
  size?: number;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const offset = CIRCUMFERENCE * (1 - pct);
  const viewBox = 118;
  const center = viewBox / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`} className="-rotate-90">
        <circle cx={center} cy={center} r={RADIUS} fill="none" stroke="var(--linen-deep)" strokeWidth={10} />
        <circle
          cx={center}
          cy={center}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[28px] font-medium leading-none text-graphite">{Math.round(value)}</div>
        {label && (
          <div className="mt-1 font-data text-[9px] uppercase tracking-wider text-graphite-45">{label}</div>
        )}
      </div>
    </div>
  );
}