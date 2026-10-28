import type { ReactNode } from "react";

/**
 * The recurring "specimen" wrapper — a card with the signature
 * gradient top edge and an accession number (a real reference, e.g. a
 * report ID or scan ID — never a decorative placeholder). Use
 * SpecimenFoot for the optional plain-language note at the bottom.
 */
export function SpecimenCard({
  accessionLabel,
  accessionNumber,
  meta,
  tag,
  children,
  foot,
}: {
  /** e.g. "SPECIMEN" or "REPORT" */
  accessionLabel: string;
  /** e.g. a real report/scan/product id */
  accessionNumber: string | number;
  /** e.g. "SCANNED 08:14" or a date */
  meta?: string;
  /** Optional small pill in the top-right, e.g. "Suitable for you" */
  tag?: ReactNode;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-hairline bg-card shadow-[0_1px_2px_rgba(28,34,28,0.05),0_20px_45px_-20px_rgba(28,34,28,0.18)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sage via-saffron to-garnet" />
      <div className="p-[30px] pb-[26px]">
        <div className="mb-[22px] flex items-start justify-between">
          <div className="font-data text-[11px] tracking-wide text-graphite-45">
            {accessionLabel} <b className="text-graphite-70">№ {accessionNumber}</b>
            {meta && <> — {meta}</>}
          </div>
          {tag && (
            <span className="rounded-full bg-sage-soft px-2.5 py-1 font-data text-[10.5px] uppercase tracking-wide text-sage">
              {tag}
            </span>
          )}
        </div>
        {children}
      </div>
      {foot && (
        <div className="flex items-start gap-2 border-t border-hairline bg-linen-deep px-[30px] py-4 text-[12.5px] text-graphite-70">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
          <div>{foot}</div>
        </div>
      )}
    </div>
  );
}