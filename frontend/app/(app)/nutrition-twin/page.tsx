import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  FileText,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { GenerateTwinButton } from "@/components/GenerateTwinButton";
import { getLatestNutritionTwin } from "@/lib/actions/nutrition-twin";

export default async function NutritionTwinPage() {
  const twin = await getLatestNutritionTwin();

  return (
    <div className="relative isolate space-y-4 pb-12">
      <div
        className="pointer-events-none absolute inset-x-1/2 -top-6 -bottom-12 -z-10 w-screen -translate-x-1/2 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(96,165,250,0.10) 42%, rgba(251,146,120,0.09) 76%, rgba(196,181,253,0.12) 100%), radial-gradient(ellipse 58% 20% at 5% 9%, rgba(167,139,250,0.28), transparent 78%), radial-gradient(ellipse 55% 24% at 96% 31%, rgba(96,165,250,0.25), transparent 78%), radial-gradient(ellipse 58% 24% at 7% 57%, rgba(251,146,120,0.18), transparent 78%), radial-gradient(ellipse 60% 22% at 92% 83%, rgba(167,139,250,0.22), transparent 78%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(rgba(129,140,248,0.3) 0.8px, transparent 0.8px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <section className="relative isolate overflow-hidden rounded-[26px] border border-glass-border bg-glass-card shadow-[0_12px_36px_rgba(28,34,28,0.09)]">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_74%_45%,rgba(167,139,250,0.28),transparent_38%),radial-gradient(ellipse_at_4%_100%,rgba(96,165,250,0.22),transparent_38%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(112deg, rgba(167,139,250,0.14), transparent 45%, rgba(96,165,250,0.18))",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -right-12 -top-28 -z-10 h-72 w-72 rounded-full border border-sage/20" aria-hidden="true" />
        <div className="pointer-events-none absolute right-5 top-4 -z-10 h-56 w-56 rounded-full border border-dashed border-sage/20" aria-hidden="true" />

        <div className="relative flex min-h-[225px] flex-col justify-center gap-8 px-6 py-8 sm:px-9 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="max-w-[600px]">
            <p className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-sage">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Report-based insights
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-graphite sm:text-5xl">
              Your Nutrition Twin
            </h1>
            <p className="mt-2 max-w-[550px] text-sm leading-6 text-graphite-70 sm:text-base">
              A personalised view of your health, built from your report history — with key trends, flagged markers and a risk outlook.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <div className="hidden items-center gap-3 rounded-2xl border border-glass-border bg-glass-card-inner px-4 py-3 text-sage shadow-sm backdrop-blur-sm sm:flex">
              <TwinIllustration />
              <div className="space-y-1.5 text-[11px] font-medium text-graphite-70">
                <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-sage" /> Health trends</span>
                <span className="flex items-center gap-1.5"><HeartPulse className="h-3.5 w-3.5 text-water-blue" /> Nutrition insights</span>
              </div>
            </div>
            <GenerateTwinButton />
          </div>
        </div>
      </section>

      <section aria-label="Nutrition twin overview" className="grid gap-4 md:grid-cols-3">
        <OverviewCard
          icon={FileText}
          title="Report History"
          description={twin ? "Your snapshot is based on your report history." : "Upload reports over time to build a report-based snapshot."}
          tone="sage"
          status={twin ? "Snapshot available" : "Awaiting reports"}
          href="/reports"
        />
        <OverviewCard
          icon={TriangleAlert}
          title="Flagged Markers"
          description={twin ? twin.deficiencyTrendSummary : "Marker summaries will appear here after a snapshot is generated."}
          tone="garnet"
          status={twin ? "Review summary" : "No snapshot yet"}
          href={twin ? "#snapshot-flags" : "/reports"}
        />
        <OverviewCard
          icon={ChartNoAxesCombined}
          title="Trend Stability"
          description={twin ? "Your report-based trend summary is ready to review." : "Generate a snapshot to review health trends over time."}
          tone="water"
          status={twin ? "Summary available" : "No snapshot yet"}
          href={twin ? "#snapshot-trends" : "/reports"}
        />
      </section>

      {!twin ? (
        <section className="rounded-[22px] border border-glass-border bg-glass-card p-6 shadow-[0_8px_28px_rgba(28,34,28,0.07)] sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-water-blue/15 text-water-blue">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold text-graphite">No snapshot yet</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-graphite-70">
                Upload at least two reports over time, then generate a Nutrition Twin to see your health trends, current flags and risk outlook.
              </p>
            </div>
            <Link
              href="/reports"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-graphite px-4 py-2.5 text-sm font-semibold text-linen transition hover:bg-sage sm:ml-auto"
            >
              View reports <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-[22px] border border-glass-border bg-glass-card shadow-[0_8px_28px_rgba(28,34,28,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-glass-card-inner px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-water-blue/15 text-water-blue">
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-graphite">Latest Snapshot</h2>
                  <p className="text-xs text-graphite-70">As of {twin.snapshotDate}</p>
                </div>
              </div>
              <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs font-medium text-sage transition hover:text-garnet">
                View report history <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[2fr_1fr]">
              <article id="snapshot-trends" className="rounded-[16px] border border-hairline bg-glass-card-inner p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <ChartNoAxesCombined className="h-4 w-4 text-sage" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-graphite">Trends from your reports</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-graphite-70">{twin.healthTrendSummary}</p>
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-hairline bg-card/70 px-3 py-2.5 text-xs text-graphite-70">
                  <Activity className="h-4 w-4 shrink-0 text-sage" aria-hidden="true" />
                  Trend summary generated from available report history
                </div>
              </article>
              <article className="relative overflow-hidden rounded-[16px] border border-hairline bg-sage-soft/60 p-5 sm:p-6">
                <div className="pointer-events-none absolute -bottom-12 -right-10 h-36 w-36 rounded-full border-[18px] border-sage/10" aria-hidden="true" />
                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-sage shadow-sm">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-semibold text-graphite">About this snapshot</h3>
                  <p className="mt-1.5 text-sm leading-6 text-graphite-70">
                    This Nutrition Twin was generated from the reports available in your history. Review your reports for source details.
                  </p>
                  <Link href="/reports" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-sage hover:text-garnet">
                    Open reports <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </div>
          </section>

          <section aria-label="Nutrition twin insights" className="grid gap-4 md:grid-cols-3">
            <InsightCard
              id="insight-trends"
              icon={ChartNoAxesCombined}
              title="Trends"
              description={twin.healthTrendSummary}
              tag="Report history"
              tone="water"
            />
            <InsightCard
              id="snapshot-flags"
              icon={TriangleAlert}
              title="Current deficiencies / flags"
              description={twin.deficiencyTrendSummary}
              tag="Marker summary"
              tone="garnet"
            />
            <InsightCard
              id="snapshot-risk"
              icon={ShieldCheck}
              title="Risk projection"
              description={twin.riskPredictionSummary}
              tag="Outlook"
              tone="sage"
            />
          </section>
        </>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-glass-card-inner px-4 py-3 text-xs leading-5 text-graphite-70">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage" aria-hidden="true" />
        <span>
          This is a report-based nutrition insight tool and not a validated clinical risk model. It is not a substitute for professional medical advice, diagnosis or treatment.
        </span>
      </p>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  title,
  description,
  tone,
  status,
  href,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  tone: "sage" | "garnet" | "water";
  status: string;
  href: string;
}) {
  const tones = {
    sage: { icon: "bg-sage-soft text-sage", status: "bg-sage-soft text-sage" },
    garnet: { icon: "bg-garnet-soft text-garnet", status: "bg-garnet-soft text-garnet" },
    water: { icon: "bg-water-blue/15 text-water-blue", status: "bg-water-blue/15 text-water-blue" },
  }[tone];

  return (
    <Link
      href={href}
      className="group flex min-h-[116px] items-start gap-3 rounded-[18px] border border-glass-border bg-glass-card p-4 shadow-[0_5px_20px_rgba(28,34,28,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_24px_rgba(28,34,28,0.1)]"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones.icon}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-graphite">{title}</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tones.status}`}>{status}</span>
        </span>
        <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-graphite-70">{description}</span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-graphite-45 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

function InsightCard({
  id,
  icon: Icon,
  title,
  description,
  tag,
  tone,
}: {
  id: string;
  icon: typeof ChartNoAxesCombined;
  title: string;
  description: string;
  tag: string;
  tone: "water" | "garnet" | "sage";
}) {
  const tones = {
    water: { icon: "bg-water-blue/15 text-water-blue", tag: "bg-water-blue/15 text-water-blue" },
    garnet: { icon: "bg-garnet-soft text-garnet", tag: "bg-garnet-soft text-garnet" },
    sage: { icon: "bg-sage-soft text-sage", tag: "bg-sage-soft text-sage" },
  }[tone];

  return (
    <article id={id} className="flex h-full min-h-[170px] flex-col rounded-[18px] border border-glass-border bg-glass-card p-5 shadow-[0_5px_20px_rgba(28,34,28,0.06)]">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones.icon}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-graphite">{title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-graphite-70">{description}</p>
        </div>
      </div>
      <span className={`mt-auto ml-14 w-fit rounded-full px-3 py-1 text-[10px] font-semibold ${tones.tag}`}>{tag}</span>
    </article>
  );
}

function TwinIllustration() {
  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-sage/25 bg-[radial-gradient(circle,color-mix(in_srgb,var(--water-blue)_18%,transparent)_0%,transparent_72%)]">
      <svg viewBox="0 0 80 96" className="h-[76px] w-[64px] text-water-blue" fill="none" aria-hidden="true">
        <circle cx="40" cy="15" r="10" fill="currentColor" fillOpacity=".38" />
        <path d="M24 36c0-7 7-12 16-12s16 5 16 12l5 34c1 7-4 12-11 12H30c-7 0-12-5-11-12l5-34Z" fill="currentColor" fillOpacity=".26" stroke="currentColor" strokeWidth="1.5" />
        <path d="M36 28c13 5-8 11 6 17s-12 11 1 17-8 10 2 16" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" />
        <path d="M44 28c-13 5 8 11-6 17s12 11-1 17 8 10-2 16" stroke="var(--sage)" strokeWidth="2" strokeLinecap="round" />
        <path d="M37 34h7M36 44h9M37 54h7M38 64h8M39 74h7" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="absolute -right-1 top-3 h-2 w-2 rounded-full bg-water-blue" />
      <span className="absolute bottom-3 -left-1 h-1.5 w-1.5 rounded-full bg-sage" />
    </div>
  );
}
