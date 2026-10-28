import { authedFetchReadOnly } from "@/lib/backend";
import { UploadScanForm } from "@/components/UploadScanForm";
import { ProductScansList } from "@/components/ProductScansList";
import type { PagedResponse, ProductScanResponse } from "@/lib/types";
import { ScanLine } from "lucide-react";

export default async function ScanPage() {
  const scans = await authedFetchReadOnly<PagedResponse<ProductScanResponse>>(
    "/product-scans?size=20&sort=uploadedAt,desc"
  );

  return (
    <div className="relative mx-auto -mt-6 max-w-7xl overflow-visible pb-16 text-graphite">
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 top-[72px] z-0 overflow-hidden">
        <div className="scan-page-background absolute inset-0" />
        <div className="absolute left-[max(1.5rem,calc((100vw-1320px)/2))] top-32 hidden h-44 w-44 rounded-[2rem] border bg-white/10 lg:block dark:bg-[#15303a]/10" style={{ borderColor: "var(--scan-art-faint)" }}>
          <div className="absolute -left-2 -top-2 h-8 w-8 rounded-tl-xl border-l-[3px] border-t-[3px]" style={{ borderColor: "var(--scan-art)" }} />
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-tr-xl border-r-[3px] border-t-[3px]" style={{ borderColor: "var(--scan-art)" }} />
          <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-bl-xl border-b-[3px] border-l-[3px]" style={{ borderColor: "var(--scan-art)" }} />
          <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-br-xl border-b-[3px] border-r-[3px]" style={{ borderColor: "var(--scan-art)" }} />
          <div className="absolute inset-x-5 top-1/2 h-px" style={{ backgroundColor: "var(--scan-art-faint)" }} />
          <div className="absolute inset-y-5 left-1/2 w-px" style={{ backgroundColor: "var(--scan-art-faint)" }} />
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border" style={{ borderColor: "var(--scan-art)" }} />
        </div>
        <div className="absolute right-[max(2rem,calc((100vw-1320px)/2))] top-40 hidden h-40 w-28 rotate-6 rounded-2xl border bg-white/20 p-4 shadow-[0_12px_30px_rgba(54,48,75,0.06)] lg:block dark:bg-[#211b32]/20" style={{ borderColor: "var(--scan-history-border)" }}>
          <div className="h-2 w-10 rounded-full" style={{ backgroundColor: "var(--scan-paper-art)" }} />
          <div className="mt-4 h-10 rounded-md bg-[#8daeb8]/20 dark:bg-[#7cc9dc]/15" />
          <div className="mt-3 space-y-2">
            <div className="h-px" style={{ backgroundColor: "var(--scan-art-faint)" }} />
            <div className="h-px w-4/5" style={{ backgroundColor: "var(--scan-art-faint)" }} />
            <div className="h-px" style={{ backgroundColor: "var(--scan-art-faint)" }} />
          </div>
          <div className="mt-4 flex h-7 items-end gap-[3px]">
            <span className="h-full w-1" style={{ backgroundColor: "var(--scan-paper-art)" }} />
            <span className="h-4/5 w-0.5" style={{ backgroundColor: "var(--scan-paper-art)" }} />
            <span className="h-full w-1" style={{ backgroundColor: "var(--scan-paper-art)" }} />
            <span className="h-3/5 w-0.5" style={{ backgroundColor: "var(--scan-paper-art)" }} />
            <span className="h-full w-1" style={{ backgroundColor: "var(--scan-paper-art)" }} />
            <span className="h-4/5 w-0.5" style={{ backgroundColor: "var(--scan-paper-art)" }} />
            <span className="h-full w-1" style={{ backgroundColor: "var(--scan-paper-art)" }} />
          </div>
        </div>
        <div className="absolute bottom-28 left-[27%] h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--scan-art)" }} />
        <div className="absolute right-[28%] top-[42%] h-3 w-3 rounded-full" style={{ backgroundColor: "var(--scan-paper-art)" }} />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <header className="pb-7 pt-2 lg:pb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] shadow-[0_10px_20px_rgba(35,109,128,0.08)] backdrop-blur-sm" style={{ backgroundColor: "var(--scan-badge-bg)", borderColor: "var(--scan-badge-border)", color: "var(--scan-badge-text)" }}>
            <ScanLine className="h-3.5 w-3.5" />
            Label scanner
          </div>
          <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.07em] text-graphite sm:text-[3.2rem] lg:text-[3.8rem]">
            Scan a product
          </h1>
          <p className="mt-3 max-w-2xl text-base text-graphite-70 sm:text-lg">
            Turn a nutrition label into clear product insights. Upload a photo or capture one with your camera.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
          <section className="rounded-[26px] border p-4 shadow-[0_18px_32px_rgba(37,91,105,0.08)] backdrop-blur-sm sm:p-6" style={{ backgroundColor: "var(--scan-upload-surface)", borderColor: "var(--scan-upload-border)" }}>
            <div className="mb-5">
              <h2 className="font-display text-2xl tracking-[-0.04em] text-graphite">Add a label photo</h2>
              <p className="mt-1 text-sm text-graphite-70">Nutrition facts, ingredients, or both.</p>
            </div>
            <UploadScanForm />
            <p className="mt-4 rounded-2xl bg-linen/80 p-4 text-sm leading-6 text-graphite-70">
              A clear photo of the nutrition facts panel and/or ingredients list on the back of the pack works best.
              Analysis runs in the background. When it completes, you&rsquo;ll see nutrition facts, personalized
              suitability, and recommended quantity.
            </p>
          </section>

          <section className="rounded-[26px] border p-4 shadow-[0_18px_32px_rgba(66,55,96,0.07)] backdrop-blur-sm sm:p-6" style={{ backgroundColor: "var(--scan-history-surface)", borderColor: "var(--scan-history-border)" }}>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl tracking-[-0.04em] text-graphite">Your scans</h2>
                <p className="mt-1 text-sm text-graphite-70">Recent uploads and analysis status.</p>
              </div>
              <span className="rounded-full px-3 py-1 font-data text-xs" style={{ backgroundColor: "var(--scan-counter-bg)", color: "var(--scan-badge-text)" }}>
                {scans.content.length} total
              </span>
            </div>
            <ProductScansList initialScans={scans.content} />
          </section>
        </div>
      </div>
    </div>
  );
}