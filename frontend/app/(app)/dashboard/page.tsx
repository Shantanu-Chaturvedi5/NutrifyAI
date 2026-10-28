import Link from "next/link";
import { authedFetchReadOnly, authedFetchOptional, BackendError } from "@/lib/backend";
import { StatusBadge } from "@/components/StatusBadge";
import { RadialGauge } from "@/components/ui/RadialGauge";
import { WaterDroplet } from "@/components/ui/WaterDroplet";
import { BackgroundSlideshow } from "@/components/ui/BackgroundSlideshow";
import { getActiveDietPlanAction } from "@/lib/actions/diet-plan";
import { getLatestNutritionTwin } from "@/lib/actions/nutrition-twin";
import { getCurrentCartAction } from "@/lib/actions/grocery";
import { listMenusAction } from "@/lib/actions/restaurant-menu";
import { getTodaySummaryAction } from "@/lib/actions/intake-tracking";
import {
  Activity,
  ClipboardPlus,
  Droplets,
  Dumbbell,
  Footprints,
  HeartPulse,
  Pill,
  Salad,
  type LucideIcon,
} from "lucide-react";
import type {
  HealthProfileResponse,
  MedicalReportResponse,
  PagedResponse,
  PeopleLikeYouItemResponse,
  ProductScanResponse,
  UserResponse,
} from "@/lib/types";

function DashboardSymbol({
  icon: Icon,
  className,
  color,
}: {
  icon: LucideIcon;
  className: string;
  color: "garnet" | "sage" | "saffron";
}) {
  const colorClass = {
    garnet: "text-garnet",
    sage: "text-sage",
    saffron: "text-saffron",
  }[color];

  return (
    <div
      className={`absolute hidden h-36 w-36 items-center justify-center opacity-70 min-[1440px]:flex ${colorClass} ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-2 rounded-full border border-current/30 bg-current/[0.08] shadow-[0_12px_32px_rgba(28,34,28,0.08)]" />
      <div className="absolute inset-0 rounded-full border border-dashed border-current/35" />
      <Icon className="relative h-16 w-16" strokeWidth={1.7} />
    </div>
  );
}

async function loadProfile(): Promise<HealthProfileResponse | null> {
  try {
    return await authedFetchReadOnly<HealthProfileResponse>("/health-profile");
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) return null;
    throw e;
  }
}

// Decorative mini sparkline wave for intake metrics
function SparklineWave({ color, id }: { color: string; id: string }) {
  return (
    <div className="mt-2.5 h-6 w-full overflow-hidden">
      <svg viewBox="0 0 100 24" className="h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,18 C15,8 25,22 40,12 C55,4 68,20 82,10 C92,4 98,14 100,12 L100,24 L0,24 Z"
          fill={`url(#${id})`}
        />
        <path
          d="M0,18 C15,8 25,22 40,12 C55,4 68,20 82,10 C92,4 98,14 100,12"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Decorative trend lines for Nutrition Twin card
function TrendCharts() {
  return (
    <div className="flex flex-col gap-3 py-1">
      <div className="h-7 w-28 sm:w-36">
        <svg viewBox="0 0 120 28" className="h-full w-full overflow-visible">
          <path
            d="M0,16 C25,22 45,8 70,14 C95,20 110,6 120,8"
            fill="none"
            stroke="var(--sage)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="0" cy="16" r="3" fill="var(--sage)" />
          <circle cx="70" cy="14" r="3" fill="var(--sage)" />
          <circle cx="120" cy="8" r="3" fill="var(--sage)" />
        </svg>
      </div>
      <div className="h-7 w-28 sm:w-36">
        <svg viewBox="0 0 120 28" className="h-full w-full overflow-visible">
          <path
            d="M0,14 C25,8 50,22 75,16 C100,10 112,18 120,16"
            fill="none"
            stroke="var(--saffron)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="0" cy="14" r="3" fill="var(--saffron)" />
          <circle cx="75" cy="16" r="3" fill="var(--saffron)" />
          <circle cx="120" cy="16" r="3" fill="var(--saffron)" />
        </svg>
      </div>
    </div>
  );
}

// Decorative waveform graphic for scans
function WaveformIcon() {
  return (
    <div className="flex h-5 w-14 items-center justify-center">
      <svg viewBox="0 0 60 18" className="h-full w-full">
        <path
          d="M0,9 L10,9 L14,3 L18,15 L22,6 L26,12 L30,9 L42,9 L46,2 L50,16 L54,9 L60,9"
          fill="none"
          stroke="var(--sage)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default async function DashboardPage() {
  const [user, profile, reports, peopleLikeYou, scans, dietPlan, nutritionTwin, groceryCart, menus, todaySummary] =
    await Promise.all([
      authedFetchReadOnly<UserResponse>("/auth/me"),
      loadProfile(),
      authedFetchReadOnly<PagedResponse<MedicalReportResponse>>("/reports?size=5&sort=uploadedAt,desc"),
      authedFetchOptional<PeopleLikeYouItemResponse[]>("/recommendations/people-like-you"),
      authedFetchReadOnly<PagedResponse<ProductScanResponse>>("/product-scans?size=5&sort=uploadedAt,desc"),
      getActiveDietPlanAction(),
      getLatestNutritionTwin(),
      getCurrentCartAction(),
      listMenusAction(),
      getTodaySummaryAction(),
    ]);

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const todayAccession = `${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div className="relative text-graphite pb-16">
      {/* FULL-BLEED HEALTH & BOTANICAL AMBIENT WATERMARKS (Spans viewport width, fully visible outside and between cards) */}
      <div className="pointer-events-none fixed inset-0 -z-10 select-none overflow-hidden" aria-hidden="true">
        {/* Left Outer Gutter: Lush Botanical Branch */}
        <div className="absolute -left-10 top-1/3 w-64 h-96 text-sage opacity-25 dark:opacity-30">
          <svg viewBox="0 0 200 280" fill="none" className="w-full h-full">
            <path d="M20 270 Q80 160 120 20" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M50 200 C15 180 10 135 55 125 C95 115 105 160 50 200 Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M80 145 C120 125 135 80 95 65 C55 50 45 100 80 145 Z" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.5" />
            <path d="M115 50 C135 20 170 15 160 50 C150 80 130 75 115 50 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Right Outer Gutter: Pulse Heartbeat & DNA Well-being Helix */}
        <div className="absolute -right-8 top-1/2 w-72 h-80 text-saffron opacity-20 dark:opacity-25 -scale-x-100">
          <svg viewBox="0 0 220 220" fill="none" className="w-full h-full">
            {/* Heart & Vitale line */}
            <path d="M20 110 L60 110 L75 70 L95 150 L115 90 L130 125 L145 110 L200 110" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Ambient circular wellness orbit */}
            <circle cx="110" cy="110" r="85" stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 6" />
          </svg>
        </div>

      </div>

      {/* HERO SECTION — Fading background slideshow + headline + specimen card */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 w-screen overflow-hidden pb-56 sm:pb-64">
        <BackgroundSlideshow />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pt-12 pb-8 sm:pt-16 sm:pb-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="lg:pr-6">
            <p
              className="flex items-center gap-2.5 font-data text-[11px] font-semibold uppercase tracking-widest text-garnet"
              style={{ textShadow: "0 0 20px var(--linen), 0 0 8px var(--linen)" }}
            >
              <span className="h-px w-4 bg-garnet" /> A daily practice, not a diet
            </p>
            <h1
              className="mt-5 font-display text-[38px] font-light leading-[1.05] tracking-tight sm:text-[56px]"
              style={{ textShadow: "0 0 28px var(--linen), 0 0 12px var(--linen), 0 0 4px var(--linen)" }}
            >
              Read your body&apos;s
              <br />
              paperwork <em className="font-normal italic text-garnet">fluently.</em>
            </h1>
            <p
              className="mt-6 max-w-md text-[17px] leading-relaxed text-graphite-70"
              style={{ textShadow: "0 0 20px var(--linen), 0 0 8px var(--linen)" }}
            >
              Lab reports, nutrition labels, restaurant menus, the running list on your fridge —
              NutrifyAI turns everything you eat and everything your doctor sends you into one
              plain, trustworthy read.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/track"
                className="rounded-full bg-graphite px-6 py-3.5 text-sm font-medium text-linen shadow-[0_4px_16px_rgba(28,34,28,0.18)] transition-all hover:bg-garnet hover:shadow-[0_6px_20px_rgba(217,31,66,0.3)]"
              >
                Open today&apos;s log →
              </Link>
              <span
                className="text-sm text-graphite-70"
                style={{ textShadow: "0 0 16px var(--linen), 0 0 6px var(--linen)" }}
              >
                Welcome back, {user.fullName.split(" ")[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center pt-2">
            <div className="relative z-10 -mb-7 h-[175px] w-[175px] shrink-0 overflow-hidden rounded-full border-[7px] border-white shadow-[0_16px_35px_rgba(28,34,28,0.22)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1530259152377-3a014e1092e0?auto=format&fit=crop&w=800&q=80"
                alt="Strawberries and blackberries bowl"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl shadow-[0_8px_32px_rgba(28,34,28,0.12)]">
              <div className="h-1 bg-gradient-to-r from-sage via-saffron to-garnet" />
              <div className="p-4 pt-9 sm:p-6 sm:pt-9">
                <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
                  <div className="font-data text-[11px] tracking-wide text-graphite-45">
                    SPECIMEN <b className="text-graphite-70">№ 0142</b> — SCANNED 08:14
                  </div>
                  <span className="shrink-0 rounded-full bg-sage-soft border border-sage/30 px-2.5 py-0.5 font-data text-[10.5px] uppercase tracking-wide text-sage font-medium">
                    Suitable for you
                  </span>
                </div>
                <p className="font-display text-lg font-medium text-graphite">Greek Yoghurt, Plain 400g</p>
                <p className="text-xs text-graphite-45">Milky Mist · Dairy &amp; Yoghurt</p>

                <div className="mt-5 flex items-center gap-5">
                  <RadialGauge value={85} max={100} label="Score" color="var(--sage)" size={92} />
                  <dl className="flex-1 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-4 border-b border-dashed border-hairline pb-1.5">
                      <dt className="text-graphite-70">Protein</dt>
                      <dd className="font-data font-medium text-graphite">11.2 g</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-dashed border-hairline pb-1.5">
                      <dt className="text-graphite-70">Sugar</dt>
                      <dd className="font-data font-medium text-graphite">4.8 g</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-graphite-70">Sodium</dt>
                      <dd className="font-data font-medium text-graphite">52 mg</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="flex items-start gap-2 border-t border-hairline/40 bg-glass-card-inner px-6 py-3.5 text-[12px] text-graphite-70">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                <div>High in protein relative to your goal, and low sodium fits your blood-pressure note from March&apos;s report.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD CARDS WRAPPER — OVERLAPS THE BOTTOM OF HERO */}
      <div className="-mt-44 relative z-20 sm:-mt-52">
        <div
          className="pointer-events-none absolute inset-x-1/2 inset-y-0 -z-10 w-screen -translate-x-1/2 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in srgb, var(--sage) 22%, transparent) 0.8px, transparent 0.8px)",
              backgroundSize: "20px 20px",
              maskImage: "linear-gradient(to bottom, transparent, black 8%, black 84%, transparent)",
            }}
          />
          <div
            className="absolute -left-64 top-16 h-[34rem] w-[34rem] rounded-full blur-3xl"
            style={{
              background: "radial-gradient(circle, color-mix(in srgb, var(--sage) 14%, transparent), transparent 68%)",
            }}
          />
          <div
            className="absolute -right-64 top-[34rem] h-[38rem] w-[38rem] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--saffron) 13%, transparent), transparent 68%)",
            }}
          />
          <DashboardSymbol icon={HeartPulse} color="garnet" className="left-2 top-[16rem]" />
          <DashboardSymbol icon={Droplets} color="saffron" className="right-2 top-[15rem]" />
          <DashboardSymbol icon={Salad} color="sage" className="left-2 top-[46rem]" />
          <DashboardSymbol icon={Dumbbell} color="sage" className="right-2 top-[58rem]" />
          <DashboardSymbol icon={Pill} color="garnet" className="right-2 top-[84rem]" />
          <DashboardSymbol icon={Activity} color="saffron" className="left-2 top-[104rem]" />
          <DashboardSymbol icon={ClipboardPlus} color="sage" className="right-2 top-[116rem]" />
          <DashboardSymbol icon={Footprints} color="saffron" className="left-2 bottom-8" />
        </div>

        <div className="relative space-y-7">
          {!profile && (
            <div className="rounded-2xl border border-saffron/40 bg-saffron-soft/80 backdrop-blur-md p-4 shadow-sm">
              <p className="text-sm">
                Your health profile is empty — scores and recommendations get sharper once it&apos;s filled in.
              </p>
              <Link href="/profile" className="mt-1.5 inline-block font-medium text-saffron hover:text-garnet">
                Set up your profile →
              </Link>
            </div>
          )}

        {/* SECTION 1: DAILY BIOMARKER & INTAKE PULSE */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-garnet" />
            <h2 className="font-display text-xl font-medium tracking-tight text-graphite">
              Daily Biomarker &amp; Intake Pulse
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Today's Intake Card */}
            <div className="dashboard-water-corners lg:col-span-7 rounded-3xl border border-glass-border bg-glass-card backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(28,34,28,0.12)] transition-all hover:shadow-[0_12px_36px_rgba(28,34,28,0.16)]">
              <div className="flex items-center justify-between pb-3 border-b border-hairline/25">
                <p className="flex items-center gap-2 font-data text-[11px] font-semibold uppercase tracking-widest text-garnet">
                  <span className="h-px w-3 bg-garnet" /> Today&apos;s intake
                </p>
                <Link
                  href="/track"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-graphite/10 text-graphite text-xs font-bold transition-colors hover:bg-garnet hover:text-white"
                  title="Log intake"
                >
                  +
                </Link>
              </div>

              <div className="flex items-center justify-between pt-3 pb-2 font-data text-[11px] text-graphite-45 uppercase tracking-wide">
                <span>
                  Intake <b className="text-graphite-70"># {todayAccession}</b>
                </span>
                <span>{todayLabel}</span>
              </div>

              <div className="mt-2.5 grid grid-cols-3 divide-x divide-hairline/25 rounded-2xl bg-glass-card-inner p-4 border border-glass-border">
                {/* Calories */}
                <div className="flex flex-col items-center px-2 text-center">
                  <RadialGauge
                    value={todaySummary.consumedCalories}
                    max={todaySummary.calorieTarget ?? (todaySummary.consumedCalories || 3310)}
                    color="var(--garnet)"
                    size={66}
                  />
                  <p className="mt-2 font-data text-[10px] font-semibold uppercase tracking-wider text-garnet">Calories</p>
                  <p className="mt-0.5 font-display text-base font-medium text-graphite">
                    {Math.round(todaySummary.consumedCalories)}
                    <span className="font-data text-[11px] text-graphite-45">
                      {" "}/ {Math.round(todaySummary.calorieTarget ?? 3310)}
                    </span>
                  </p>
                  <SparklineWave color="var(--garnet)" id="cal-wave" />
                </div>

                {/* Protein */}
                <div className="flex flex-col items-center px-2 text-center">
                  <RadialGauge
                    value={todaySummary.consumedProteinG}
                    max={todaySummary.proteinTarget ?? (todaySummary.consumedProteinG || 145)}
                    color="var(--saffron)"
                    size={66}
                  />
                  <p className="mt-2 font-data text-[10px] font-semibold uppercase tracking-wider text-saffron">Protein</p>
                  <p className="mt-0.5 font-display text-base font-medium text-graphite">
                    {Math.round(todaySummary.consumedProteinG)}g
                    <span className="font-data text-[11px] text-graphite-45">
                      {" "}/ {Math.round(todaySummary.proteinTarget ?? 145)}g
                    </span>
                  </p>
                  <SparklineWave color="var(--saffron)" id="protein-wave" />
                </div>

                {/* Water */}
                <div className="flex flex-col items-center px-2 text-center">
                  <div className="h-[66px] flex items-center justify-center">
                    <WaterDroplet
                      value={todaySummary.consumedWaterMl}
                      max={todaySummary.waterTargetMl ?? 2396}
                      color="var(--sage)"
                    />
                  </div>
                  <p className="mt-2 font-data text-[10px] font-semibold uppercase tracking-wider text-sage">💧 Water</p>
                  <p className="mt-0.5 font-display text-base font-medium text-graphite">
                    {Math.round(todaySummary.consumedWaterMl)}
                    <span className="font-data text-[11px] text-graphite-45">
                      {" "}/ {Math.round(todaySummary.waterTargetMl ?? 2396)}ml
                    </span>
                  </p>
                  <SparklineWave color="var(--sage)" id="water-wave" />
                </div>
              </div>
            </div>

            {/* Nutrition Twin Card */}
            <div className="dashboard-water-corners lg:col-span-5 rounded-3xl border border-glass-border bg-glass-card backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(28,34,28,0.12)] transition-all hover:shadow-[0_12px_36px_rgba(28,34,28,0.16)] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-2 font-data text-[11px] font-semibold uppercase tracking-widest text-garnet">
                      <span className="h-px w-3 bg-garnet" /> Predictive intelligence
                    </p>
                    <h3 className="mt-1 font-display text-xl font-medium tracking-tight text-graphite">Nutrition Twin</h3>
                  </div>
                  <Link href="/nutrition-twin" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                    Log more →
                  </Link>
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 text-xs leading-relaxed text-graphite-70">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-garnet">
                        <path d="M2 12h4l2-7 4 14 2-7h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p>
                        {nutritionTwin?.healthTrendSummary ?? "Your tracked values have been stable across your report history."}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="font-data text-[11px] text-graphite-45">Flagged:</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-garnet/30 bg-garnet-soft px-2.5 py-0.5 font-data text-[10.5px] font-semibold text-garnet">
                          Urinary Glucose (high)
                        </span>
                        <span className="font-data text-xs text-graphite-45">&amp;</span>
                        <span className="rounded-full border border-saffron/30 bg-saffron-soft px-2.5 py-0.5 font-data text-[10.5px] font-semibold text-saffron">
                          Red Cell Dist. Width (RDW-CV) (high)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trend line curves */}
                  <div className="shrink-0 pt-1">
                    <TrendCharts />
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-hairline/25 pt-3">
                <Link
                  href="/nutrition-twin"
                  className="flex items-center justify-between text-xs font-medium text-graphite-70 hover:text-garnet transition-colors"
                >
                  <span className="truncate">Currently flagged: RDW-CV (high), Urinary Glucose (high).</span>
                  <span className="font-data text-sage shrink-0 ml-2">View details →</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* SECTION 2: NUTRITION PROTOCOL & SMART PANTRY */}
        <section className="space-y-4 pt-6 relative">
          {/* Decorative Olive Branch Badge attached right to the section header in plain view */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-sage" />
              <h2 className="font-display text-xl font-medium tracking-tight text-graphite">
                Nutrition Protocol &amp; Smart Pantry
              </h2>
            </div>
            {/* Health & Wellness Botanical Watermark Badge */}
            <div className="hidden sm:flex items-center gap-2 font-data text-xs text-sage opacity-70">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="tracking-wide uppercase text-[10.5px]">Personalized Wellness Regimen</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Diet Plan */}
            <div className="dashboard-water-corners rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline/25">
                  <div>
                    <p className="flex items-center gap-2 font-data text-[10.5px] font-semibold uppercase tracking-widest text-garnet">
                      <span className="h-px w-3 bg-garnet" /> Active regimen
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-graphite">Diet plan</h3>
                  </div>
                  <div className="flex items-center gap-1 text-sage text-xs">
                    <span>✓</span>
                    <span className="text-graphite-45">···</span>
                  </div>
                </div>

                {!dietPlan ? (
                  <div className="rounded-2xl border border-hairline/30 bg-glass-card-inner p-5 text-xs text-graphite-70">
                    No active plan yet.{" "}
                    <Link href="/diet-plan" className="font-medium text-sage hover:text-garnet">
                      Generate one →
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/diet-plan"
                    className="block overflow-hidden rounded-2xl border border-hairline/30 bg-card/95 p-5 transition-all hover:border-graphite-45 hover:shadow-xs"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-sage">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M6 21c7 0 12-5 12-12 0-2 0-4-1-5-5 0-9 2-11 6-2 3-2 7 0 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          <path d="M6 21c0-5 2-9 6-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-display font-medium text-base text-graphite">
                            {dietPlan.planType === "ONE_DAY" ? "1-Day Protocol" : dietPlan.planType === "SEVEN_DAY" ? "7-Day Protocol" : "30-Day Protocol"}
                          </p>
                          <StatusBadge status={dietPlan.generationStatus} />
                        </div>
                        {dietPlan.calorieTarget != null && dietPlan.proteinTarget != null && (
                          <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-hairline/30 text-xs">
                            <div>
                              <span className="font-data text-[10px] uppercase text-graphite-45">Caloric Target</span>
                              <p className="font-display font-medium text-sm text-graphite">{Math.round(dietPlan.calorieTarget)} kcal</p>
                            </div>
                            <div>
                              <span className="font-data text-[10px] uppercase text-graphite-45">Protein Goal</span>
                              <p className="font-display font-medium text-sm text-graphite">{Math.round(dietPlan.proteinTarget)}g / day</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-hairline/25 flex justify-end">
                <Link href="/diet-plan" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                  View meal plan schedule →
                </Link>
              </div>
            </div>

            {/* Grocery List */}
            <div className="dashboard-water-corners rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between pb-3 border-b border-hairline/25">
                  <div>
                    <p className="flex items-center gap-2 font-data text-[10.5px] font-semibold uppercase tracking-widest text-garnet">
                      <span className="h-px w-3 bg-garnet" /> What to pick up
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-graphite">Smart grocery list</h3>
                  </div>
                  <Link href="/grocery" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                    {groceryCart.items.length > 0 ? "View list →" : "+ Start a list"}
                  </Link>
                </div>

                {groceryCart.items.length === 0 ? (
                  <div className="rounded-2xl border border-hairline/30 bg-card/95 p-5">
                    <div className="flex items-center gap-2 text-xs text-graphite-45 font-data">
                      <input type="checkbox" readOnly className="rounded border-hairline text-sage" />
                      <span>3 suggested pantry staples</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-glass-card-inner border border-hairline/30 px-3 py-1 text-[11.5px] text-graphite-70">
                        ✓ West Indies Hot &amp; Sweet Chilli
                      </span>
                      <span className="rounded-full bg-glass-card-inner border border-hairline/30 px-3 py-1 text-[11.5px] text-graphite-70">
                        ✓ Chips
                      </span>
                      <span className="rounded-full bg-glass-card-inner border border-hairline/30 px-3 py-1 text-[11.5px] text-graphite-70">
                        ✓ MULTIGRAIN ENERGY BAR
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/grocery"
                    className="block overflow-hidden rounded-2xl border border-hairline/30 bg-card/95 p-5 transition-all hover:border-graphite-45"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-graphite-45 font-data">
                        <input type="checkbox" checked readOnly className="rounded border-hairline text-sage" />
                        <span className="font-medium text-graphite">{groceryCart.items.length} item{groceryCart.items.length === 1 ? "" : "s"} in cart</span>
                      </div>
                      {groceryCart.cartHealthScore != null && (
                        <RadialGauge
                          value={groceryCart.cartHealthScore}
                          max={100}
                          label="Cart"
                          color={groceryCart.cartHealthScore >= 60 ? "var(--sage)" : "var(--saffron)"}
                          size={58}
                        />
                      )}
                    </div>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {groceryCart.items.slice(0, 4).map((i) => (
                        <span
                          key={i.id}
                          className="rounded-full border border-hairline/30 bg-glass-card-inner px-3 py-1 text-[11.5px] text-graphite-70"
                        >
                          ✓ {i.productName ?? i.rawItemName}
                        </span>
                      ))}
                      {groceryCart.items.length > 4 && (
                        <span className="rounded-full border border-dashed border-hairline px-2.5 py-1 text-[11px] text-graphite-45">
                          +{groceryCart.items.length - 4} more
                        </span>
                      )}
                    </div>
                  </Link>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-hairline/25 flex justify-end">
                <Link href="/grocery" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                  Open full checklist →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: LAB DIAGNOSTICS & SCAN ACTIVITY */}
        <section className="space-y-4 pt-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-saffron" />
              <h2 className="font-display text-xl font-medium tracking-tight text-graphite">
                Lab Diagnostics &amp; Scan Activity
              </h2>
            </div>
            {/* Health & Diagnostic Pulse Emblem */}
            <div className="hidden sm:flex items-center gap-2 font-data text-xs text-saffron opacity-80">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span className="tracking-wide uppercase text-[10.5px]">Biomarker &amp; Vision Tracking</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Reports */}
            <div className="dashboard-water-corners rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col justify-between">
              <div>
                <div className="mb-4 flex items-center justify-between pb-3 border-b border-hairline/25">
                  <div>
                    <p className="flex items-center gap-2 font-data text-[10.5px] font-semibold uppercase tracking-widest text-garnet">
                      <span className="h-px w-3 bg-garnet" /> Your paperwork
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-graphite">Recent reports</h3>
                  </div>
                  <Link href="/reports" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                    View all reports →
                  </Link>
                </div>

                {reports.content.length === 0 ? (
                  <p className="rounded-2xl border border-hairline/30 bg-glass-card-inner p-5 text-xs text-graphite-70">
                    No reports uploaded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-hairline/30 overflow-hidden rounded-2xl border border-hairline/30 bg-card/95">
                    {reports.content.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/reports/${r.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-glass-card-inner"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-graphite-45">
                            <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M15 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                          </svg>
                          <span className="flex-1 truncate text-xs font-medium text-graphite">{r.originalFilename}</span>
                          <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-data text-[10px] font-bold text-sage">
                            PDF
                          </span>
                          <span className="text-graphite-45 text-xs">📄</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-hairline/25 flex justify-end">
                <Link href="/reports" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                  Upload new medical report →
                </Link>
              </div>
            </div>

            {/* Scans & Menus Unified Feed */}
            <div className="space-y-6">
              {/* Recent Scans */}
              <div className="dashboard-water-corners rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div className="mb-4 flex items-center justify-between pb-3 border-b border-hairline/25">
                  <div>
                    <p className="flex items-center gap-2 font-data text-[10.5px] font-semibold uppercase tracking-widest text-garnet">
                      <span className="h-px w-3 bg-garnet" /> Barcode &amp; label
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-graphite">Recent scans</h3>
                  </div>
                  <Link href="/scan" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                    + New scan
                  </Link>
                </div>

                {scans.content.length === 0 ? (
                  <p className="rounded-2xl border border-hairline/30 bg-glass-card-inner p-4 text-xs text-graphite-70">
                    No scans yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-hairline/30 overflow-hidden rounded-2xl border border-hairline/30 bg-card/95">
                    {scans.content.map((s) => {
                      const row = (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-graphite-45">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M3 9h18M8 5v4" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          <span className="text-xs font-medium text-graphite">Scan #{s.id}</span>
                          <div className="flex-1 flex justify-center">
                            <WaveformIcon />
                          </div>
                          <StatusBadge status={s.processingStatus} />
                        </div>
                      );
                      return (
                        <li key={s.id}>
                          {s.processingStatus === "COMPLETED" && s.productId ? (
                            <Link href={`/products/${s.productId}`} className="block transition-colors hover:bg-glass-card-inner">
                              {row}
                            </Link>
                          ) : (
                            row
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Restaurant Menu */}
              <div className="dashboard-water-corners rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                <div className="mb-4 flex items-center justify-between pb-3 border-b border-hairline/25">
                  <div>
                    <p className="flex items-center gap-2 font-data text-[10.5px] font-semibold uppercase tracking-widest text-garnet">
                      <span className="h-px w-3 bg-garnet" /> Dining intelligence
                    </p>
                    <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-graphite">Read a restaurant menu</h3>
                  </div>
                  <Link href="/restaurant-menu" className="font-data text-xs text-sage hover:text-garnet transition-colors">
                    + Scan a menu
                  </Link>
                </div>

                {menus.content.length === 0 ? (
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline/30 bg-card/95 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linen-deep text-graphite-45 text-lg">
                        📷
                      </div>
                      <div>
                        <p className="text-xs font-medium text-graphite">No restaurant menus scanned yet</p>
                        <p className="text-[11px] text-graphite-45">Upload a food menu photo to get personalized picks</p>
                      </div>
                    </div>
                    <Link
                      href="/restaurant-menu"
                      className="shrink-0 rounded-full bg-graphite/10 px-3.5 py-1.5 text-xs font-medium text-graphite hover:bg-garnet hover:text-white transition-colors"
                    >
                      Scan menu
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-hairline/30 overflow-hidden rounded-2xl border border-hairline/30 bg-card/95">
                    {menus.content.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-xs font-medium text-graphite">{m.restaurantName ?? `Menu #${m.id}`}</span>
                        <StatusBadge status={m.processingStatus} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: RECOMMENDATIONS & COMMUNITY */}
        {peopleLikeYou && peopleLikeYou.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-garnet" />
              <h2 className="font-display text-xl font-medium tracking-tight text-graphite">
                Peer Health Discoveries
              </h2>
            </div>

            <div className="dashboard-water-corners rounded-3xl border border-glass-border bg-glass-card backdrop-blur-xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <p className="flex items-center gap-2 font-data text-[10.5px] font-semibold uppercase tracking-widest text-garnet">
                <span className="h-px w-3 bg-garnet" /> From users like you
              </p>
              <h3 className="mt-1 font-display text-lg font-medium tracking-tight text-graphite">People like you</h3>
              <p className="mb-4 text-xs text-graphite-45">
                Based on users with similar health conditions, goals, and activity level.
              </p>
              <ul className="divide-y divide-hairline/30 overflow-hidden rounded-2xl border border-hairline/30 bg-card/95">
                {peopleLikeYou.map((item) => (
                  <li key={item.productId}>
                    <Link
                      href={`/products/${item.productId}`}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-glass-card-inner"
                    >
                      <div>
                        <p className="font-medium text-sm text-graphite">{item.name}</p>
                        <p className="text-xs text-graphite-45">{item.reasoning}</p>
                      </div>
                      <span className="text-xs text-graphite-45">{item.brand}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

    </div>
  );
}