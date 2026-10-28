import { Activity, ArrowRight, FileText, FlaskConical, ScanLine, ShieldCheck } from "lucide-react";
import { authedFetchReadOnly } from "@/lib/backend";
import { UploadReportForm } from "@/components/UploadReportForm";
import { ReportsList } from "@/components/ReportsList";
import type { MedicalReportResponse, PagedResponse } from "@/lib/types";

const ANALYSIS_STEPS = [
  {
    number: "01",
    title: "Upload",
    description: "Add a lab report as a PDF or image.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Extract",
    description: "NutrifyAI identifies report values and their reference ranges.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "Understand",
    description: "Review a plain-language summary and personalized suggestions.",
    icon: Activity,
  },
];

export default async function ReportsPage() {
  const reports = await authedFetchReadOnly<PagedResponse<MedicalReportResponse>>(
    "/reports?size=20&sort=uploadedAt,desc"
  );

  return (
    <div className="relative isolate space-y-6 pb-10">
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--sage) 30%, transparent) 0.85px, transparent 0.85px)",
            backgroundSize: "24px 24px",
            maskImage: "linear-gradient(to bottom, transparent, black 8%, black 88%, transparent)",
          }}
        />
        <div
          className="absolute -left-56 top-32 h-[32rem] w-[32rem] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--sage) 24%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute -right-56 top-[42rem] h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, #8eb9c2 24%, transparent), transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, color-mix(in srgb, var(--saffron) 16%, transparent), transparent 70%)",
          }}
        />
      </div>
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-hairline bg-gradient-to-br from-card via-card to-linen-deep px-6 py-8 shadow-sm sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-8 -top-14 -z-10 h-72 w-72 rounded-full border border-sage/15 bg-sage-soft/30 sm:right-24 sm:top-1/2 sm:-translate-y-1/2" />
        <div className="pointer-events-none absolute right-8 top-8 -z-10 hidden h-56 w-56 rounded-full border border-dashed border-sage/25 sm:block" />
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 font-data text-[10px] font-semibold uppercase tracking-[0.22em] text-sage">
              <span className="h-px w-5 bg-sage" />
              Lab reports &amp; analysis
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-medium leading-[1.08] tracking-tight text-graphite sm:text-5xl">
              More than just reports,
              <br className="hidden sm:block" /> it&apos;s your health, explained.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-graphite-70 sm:text-base">
              Bring your lab results into one clear workspace. NutrifyAI extracts key values,
              explains what they mean, and helps you prepare for more informed health conversations.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-graphite-70">
              {["Plain-language summaries", "Key values in one place", "Your reports, organized"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sage-soft text-sage">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto hidden h-56 w-full max-w-md items-center justify-center lg:flex">
            <div className="absolute h-52 w-52 rounded-full bg-sage-soft/50 blur-2xl" />
            <div className="absolute right-8 top-7 h-40 w-32 rotate-6 rounded-2xl border border-hairline bg-card/80 shadow-md" />
            <div className="absolute left-14 top-5 h-48 w-36 -rotate-6 rounded-2xl border border-hairline bg-card/90 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <FileText className="h-7 w-7 text-sage" />
                <FlaskConical className="h-5 w-5 text-saffron" />
              </div>
              <div className="mt-5 h-2 w-20 rounded-full bg-graphite/15" />
              <div className="mt-2 h-1.5 w-28 rounded-full bg-graphite/10" />
              <div className="mt-4 space-y-2.5">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="grid grid-cols-[1fr_0.55fr_0.35fr] gap-2">
                    <span className="h-1.5 rounded-full bg-sage/25" />
                    <span className="h-1.5 rounded-full bg-graphite/10" />
                    <span className="h-1.5 rounded-full bg-graphite/10" />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-sage-soft/70 p-2">
                <Activity className="h-4 w-4 text-sage" />
                <span className="h-1.5 w-20 rounded-full bg-sage/30" />
              </div>
            </div>
            <div className="absolute bottom-3 right-0 flex items-center gap-3 rounded-2xl border border-hairline bg-card/95 p-3 shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-soft text-sage">
                <Activity className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold text-graphite">Results, made clearer</span>
                <span className="mt-1 block text-[10px] text-graphite-70">Values · ranges · context</span>
              </span>
              <ArrowRight className="ml-1 h-4 w-4 text-sage" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid items-stretch gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <div id="upload-report" className="rounded-3xl border border-hairline bg-card p-5 shadow-[0_8px_28px_rgba(28,34,28,0.06)] sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-sage">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-graphite">Upload a lab report</h2>
              <p className="mt-1 text-xs leading-5 text-graphite-70">
                Add a PDF or a clear image. Choose a report type to get started.
              </p>
            </div>
          </div>
          <UploadReportForm />
          <div className="mt-4 flex gap-3 rounded-2xl border border-hairline/70 bg-linen/70 p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
            <p className="text-[11px] leading-5 text-graphite-70">
              Upload blood, CBC, lipid, HbA1c, thyroid, vitamin, or other medical reports. Analysis runs in the background.
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-hairline bg-card p-5 shadow-[0_8px_28px_rgba(28,34,28,0.06)] sm:p-6">
          <ReportsList initialReports={reports.content} />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-hairline bg-gradient-to-br from-card via-card to-linen-deep/70 p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div>
            <p className="font-data text-[10px] font-semibold uppercase tracking-[0.2em] text-sage">
              How NutrifyAI analyzes your reports
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-graphite sm:text-3xl">
              From raw data to clearer insights
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-graphite-70">
              Your report is processed into a readable summary, with extracted values and suggestions
              gathered together for review.
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {ANALYSIS_STEPS.map(({ number, title, description, icon: Icon }, index) => (
                <div key={number} className="relative">
                  {index < ANALYSIS_STEPS.length - 1 && (
                    <ArrowRight className="absolute right-1 top-3 hidden h-4 w-4 text-graphite-45 sm:block" />
                  )}
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sage/20 bg-sage-soft/70 text-sage">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 font-data text-[10px] font-semibold tracking-widest text-graphite-45">{number}</p>
                  <h3 className="mt-1 text-sm font-semibold text-graphite">{title}</h3>
                  <p className="mt-1 max-w-[14rem] text-xs leading-5 text-graphite-70">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-sage/15 bg-card/90 p-5 shadow-[0_12px_32px_rgba(28,34,28,0.08)]">
            <div className="flex items-center justify-between border-b border-hairline/70 pb-3">
              <div>
                <p className="font-data text-[9px] font-semibold uppercase tracking-widest text-sage">Report workspace</p>
                <p className="mt-1 font-display text-base font-semibold text-graphite">Your analysis, organized</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-soft text-sage">
                <FlaskConical className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["Extracted values", "Parameters and reference ranges"],
                ["Summary", "A plain-language overview"],
                ["Suggestions", "Personalized next steps to review"],
              ].map(([title, description], index) => (
                <div key={title} className="flex items-center gap-3 rounded-xl border border-hairline/60 bg-linen/50 p-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === 1 ? "bg-saffron-soft text-saffron" : "bg-sage-soft text-sage"}`}>
                    {index === 0 ? <Activity className="h-4 w-4" /> : index === 1 ? <ScanLine className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-graphite">{title}</span>
                    <span className="mt-0.5 block text-[10px] text-graphite-70">{description}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-graphite-45">
              AI-generated information is not a substitute for medical advice.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
