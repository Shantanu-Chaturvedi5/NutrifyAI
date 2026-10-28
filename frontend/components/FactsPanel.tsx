import type { ReactNode } from "react";

/**
 * The recurring visual signature of the app: every place we show
 * structured health/nutrition data borrows the FDA Nutrition Facts label
 * layout — thick title rule, thin row dividers, bold right-aligned mono
 * numerals. Used for the health profile summary, report status, and
 * product nutrition breakdown.
 */
export function FactsPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-card text-graphite">
      <div className="border-b-4 border-graphite px-4 pt-3 pb-2">
        <h2 className="font-display text-2xl font-black uppercase tracking-tight leading-none text-graphite">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-graphite-70">{subtitle}</p>}
      </div>
      <div className="divide-y divide-hairline">{children}</div>
    </div>
  );
}

export function FactsRow({
  label,
  value,
  bold = false,
  indent = false,
}: {
  label: string;
  value: ReactNode;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-4 px-4 py-2 ${indent ? "pl-8" : ""}`}>
      <span className={bold ? "font-semibold text-graphite" : "text-graphite-70"}>{label}</span>
      <span className={`font-data text-graphite ${bold ? "text-lg font-semibold" : ""}`}>{value}</span>
    </div>
  );
}