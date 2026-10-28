"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  Apple,
  ClipboardList,
  Droplets,
  Flame,
  Info,
  Plus,
  Salad,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  deleteEntryAction,
  getTodaySummaryAction,
  logFoodAction,
  logWaterAction,
  type ActionState,
  type DailyIntakeSummaryResponse,
} from "@/lib/actions/intake-tracking";

const initialState: ActionState = {};
const WATER_QUICK_ADDS = [100, 250, 500];

const NUTRIENT_STYLES = {
  calories: {
    icon: Flame,
    label: "Calories",
    color: "text-[#d95656]",
    iconBg: "bg-[#ffe8e6]",
    progress: "bg-[#f2a19d]",
    badge: "bg-[#fff0ee] text-[#c84c4c]",
  },
  protein: {
    icon: Apple,
    label: "Protein",
    color: "text-[#238c84]",
    iconBg: "bg-[#dff5f0]",
    progress: "bg-[#7bcfc2]",
    badge: "bg-[#e5f7f3] text-[#238c84]",
  },
  water: {
    icon: Droplets,
    label: "Water",
    color: "text-[#2585c8]",
    iconBg: "bg-[#e1f2ff]",
    progress: "bg-[#75bff1]",
    badge: "bg-[#e6f4ff] text-[#2585c8]",
  },
} satisfies Record<string, {
  icon: LucideIcon;
  label: string;
  color: string;
  iconBg: string;
  progress: string;
  badge: string;
}>;

export function IntakeTrackerView({ initialSummary }: { initialSummary: DailyIntakeSummaryResponse }) {
  const [summary, setSummary] = useState(initialSummary);
  const [state, formAction, pending] = useActionState(logFoodAction, initialState);
  const [busy, setBusy] = useState<string | null>(null);
  const [customWater, setCustomWater] = useState("");

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await getTodaySummaryAction();
      setSummary(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogWater(ml: number) {
    setBusy("water");
    try {
      const updated = await logWaterAction(ml);
      setSummary(updated);
      setCustomWater("");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: number) {
    setBusy(`entry-${id}`);
    try {
      const updated = await deleteEntryAction(id);
      setSummary(updated);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5 pb-12">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-white/80 bg-[#fffaf3] shadow-[0_12px_36px_rgba(38,72,67,0.08)]">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-[position:72%_center]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,250,243,0.98) 0%, rgba(255,250,243,0.92) 36%, rgba(255,250,243,0.45) 68%, rgba(255,250,243,0.12) 100%), url('https://images.unsplash.com/photo-1623428188495-89c064ee061a?auto=format&fit=crop&w=1600&q=80')",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-5 top-4 z-0 hidden h-48 w-48 rounded-full bg-[#f6dceb]/60 blur-3xl sm:block"
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-[220px] items-center px-6 py-8 sm:px-10 lg:px-12">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#36786c] shadow-sm ring-1 ring-white/80">
              <Salad className="h-4 w-4" aria-hidden="true" />
              Track your nutrition
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-[#125b61] sm:text-5xl">
              Today&apos;s Intake
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#64828b] sm:text-base">
              Stay consistent, stay healthy. Track your calories, protein, water and more — all in one place.
            </p>
            <div className="mt-3 h-1 w-16 rounded-full bg-[#bea8f5]" />
          </div>
          <div style={{ fontFamily: "Caveat, cursive" }} className="ml-auto hidden max-w-[230px] rotate-[-5deg] pr-4 text-right text-2xl font-semibold leading-tight text-[#146d76] lg:block">
            Good food
            <br />
            fuels a better you <span aria-hidden="true">♥</span>
          </div>
        </div>
      </section>

      <section aria-label="Today's nutrition progress" className="grid gap-4 sm:grid-cols-3">
        <NutrientProgress
          kind="calories"
          consumed={summary.consumedCalories}
          target={summary.calorieTarget}
          remaining={summary.remainingCalories}
          unit="kcal"
        />
        <NutrientProgress
          kind="protein"
          consumed={summary.consumedProteinG}
          target={summary.proteinTarget}
          remaining={summary.remainingProteinG}
          unit="g"
        />
        <NutrientProgress
          kind="water"
          consumed={summary.consumedWaterMl}
          target={summary.waterTargetMl}
          remaining={summary.remainingWaterMl}
          unit="mL"
        />
      </section>

      {summary.calorieTarget != null && (
        <p className="flex items-start gap-2 px-1 text-xs leading-5 text-[#777c9f]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#9581e8]" aria-hidden="true" />
          {summary.targetsFromActivePlan
            ? "Calorie/protein targets are from your active diet plan."
            : "Calorie/protein targets are calculated from your health profile — generate a diet plan for more detail."}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_8px_28px_rgba(25,77,74,0.08)] backdrop-blur-xl sm:p-6">
          <SectionTitle icon={Apple} title="Log Food" />
          <form action={formAction} className="mt-5 space-y-3.5">
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-[#145d68]">
                What did you eat?
              </label>
              <input
                id="description"
                name="description"
                placeholder="e.g. Grilled chicken sandwich"
                required
                className="w-full rounded-lg border border-[#d8e1e6] bg-white/90 px-3.5 py-2.5 text-sm text-[#164f59] placeholder:text-[#9aafbb] outline-none transition focus:border-[#55aaa0] focus:ring-2 focus:ring-[#55aaa0]/20"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="calories" className="mb-1 block text-sm font-medium text-[#145d68]">
                  Calories
                </label>
                <input
                  id="calories"
                  name="calories"
                  type="number"
                  min={1}
                  required
                  placeholder="e.g. 250"
                  className="w-full rounded-lg border border-[#d8e1e6] bg-white/90 px-3.5 py-2.5 text-sm text-[#164f59] placeholder:text-[#9aafbb] outline-none transition focus:border-[#55aaa0] focus:ring-2 focus:ring-[#55aaa0]/20"
                />
              </div>
              <div>
                <label htmlFor="proteinG" className="mb-1 block text-sm font-medium text-[#145d68]">
                  Protein (g)
                </label>
                <input
                  id="proteinG"
                  name="proteinG"
                  type="number"
                  min={0}
                  placeholder="e.g. 20"
                  className="w-full rounded-lg border border-[#d8e1e6] bg-white/90 px-3.5 py-2.5 text-sm text-[#164f59] placeholder:text-[#9aafbb] outline-none transition focus:border-[#55aaa0] focus:ring-2 focus:ring-[#55aaa0]/20"
                />
              </div>
            </div>

            {state.error && (
              <p role="alert" className="rounded-lg border border-[#efb9b4] bg-[#fff1ef] px-3 py-2 text-sm text-[#a23f39]">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-full bg-[#12616a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0e5158] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {pending ? "Logging…" : "Log it"}
            </button>
          </form>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-[#71909a]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Or use the “Log to today’s intake” button on any product page to log it with real nutrition data instead of typing it in.
          </p>
        </section>

        <section className="flex min-h-[300px] flex-col rounded-[24px] border border-white/90 bg-white/80 p-5 shadow-[0_8px_28px_rgba(25,77,74,0.08)] backdrop-blur-xl sm:p-6">
          <SectionTitle icon={ClipboardList} title="Today’s Log" />
          {summary.entries.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[radial-gradient(circle,#e5f6f0_0%,rgba(229,246,240,0.25)_68%,transparent_70%)]">
                <ClipboardList className="h-16 w-16 text-[#65b9a9]" strokeWidth={1.5} aria-hidden="true" />
                <Sparkles className="absolute right-1 top-2 h-5 w-5 text-[#e9b64d]" aria-hidden="true" />
                <Apple className="absolute bottom-3 left-1 h-5 w-5 text-[#e8957d]" aria-hidden="true" />
              </div>
              <p className="mt-3 font-medium text-[#145d68]">Nothing logged yet today.</p>
              <p className="mt-1 text-sm text-[#7897a1]">Start by adding your first meal above!</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-[#e4ecec]" aria-live="polite">
              {summary.entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-3 first:pt-1">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[#145d68]">{entry.description}</p>
                    <p className="mt-0.5 text-xs text-[#7897a1]">
                      {entry.entryType === "WATER"
                        ? `${entry.waterMl} mL`
                        : [
                            entry.calories != null ? `${Math.round(entry.calories)} kcal` : null,
                            entry.proteinG != null ? `${Math.round(entry.proteinG)}g protein` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    disabled={busy === `entry-${entry.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[#a54e50] transition hover:bg-[#fff0ef] disabled:opacity-50"
                    aria-label={`Remove ${entry.description}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="relative overflow-hidden rounded-[24px] border border-white/90 bg-[linear-gradient(105deg,rgba(255,255,255,0.92)_0%,rgba(245,251,255,0.96)_66%,rgba(222,241,255,0.9)_100%)] p-5 shadow-[0_8px_28px_rgba(25,77,74,0.07)] sm:px-6">
        <div className="pointer-events-none absolute -bottom-14 right-[18%] h-36 w-64 rounded-full bg-[#cceaff]/60 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-2.5 sm:w-44 sm:shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1f2ff] text-[#2585c8]">
              <Droplets className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold text-[#145d68]">Log Water</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {WATER_QUICK_ADDS.map((ml) => (
              <button
                key={ml}
                type="button"
                onClick={() => handleLogWater(ml)}
                disabled={busy === "water"}
                className="rounded-full bg-[#edf6fb] px-4 py-2 text-sm font-medium text-[#176678] transition hover:bg-[#dceff8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                +{ml}mL
              </button>
            ))}
            <label htmlFor="custom-water" className="sr-only">Custom water amount in milliliters</label>
            <input
              id="custom-water"
              type="number"
              min={1}
              placeholder="Custom mL"
              value={customWater}
              onChange={(e) => setCustomWater(e.target.value)}
              className="w-32 rounded-lg border border-[#d8e1e6] bg-white/90 px-3 py-2 text-sm text-[#164f59] placeholder:text-[#a1b5bf] outline-none transition focus:border-[#55aaa0] focus:ring-2 focus:ring-[#55aaa0]/20"
            />
            <button
              type="button"
              onClick={() => customWater && handleLogWater(Number(customWater))}
              disabled={busy === "water" || !customWater || Number(customWater) < 1}
              className="rounded-lg bg-[#12616a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0e5158] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <div className="ml-auto hidden items-center gap-3 pr-2 lg:flex">
            <Droplets className="h-14 w-14 text-[#76b8e8]" strokeWidth={1.2} aria-hidden="true" />
            <p style={{ fontFamily: "Caveat, cursive" }} className="max-w-[140px] -rotate-3 text-xl font-semibold leading-tight text-[#28758a]">
              Small steps
              <br />
              make big changes ♥
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-[#145d68]">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2f4ef] text-[#207d77]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {title}
    </h2>
  );
}

function NutrientProgress({
  kind,
  consumed,
  target,
  remaining,
  unit,
}: {
  kind: keyof typeof NUTRIENT_STYLES;
  consumed: number;
  target: number | null;
  remaining: number | null;
  unit: string;
}) {
  const style = NUTRIENT_STYLES[kind];
  const Icon = style.icon;
  const percentage = target != null && target > 0
    ? Math.min(100, Math.max(0, (consumed / target) * 100))
    : null;

  return (
    <article className="rounded-[20px] border border-white/90 bg-white/75 p-5 shadow-[0_7px_24px_rgba(25,77,74,0.08)] backdrop-blur-xl sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-full ${style.iconBg} ${style.color}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className={`text-sm font-semibold ${style.color}`}>{style.label}</p>
            <p className="mt-0.5 font-display text-xl font-semibold text-[#145d68]">
              {Math.round(consumed)}
              {target != null && <> / {Math.round(target)}</>}{" "}
              <span className="font-body text-sm font-medium">{unit}</span>
            </p>
          </div>
        </div>
        {percentage != null && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      {percentage != null && (
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e7edef]"
          role="progressbar"
          aria-label={`${style.label} goal`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percentage)}
        >
          <div className={`h-full rounded-full transition-[width] duration-500 ${style.progress}`} style={{ width: `${percentage}%` }} />
        </div>
      )}
      {remaining != null && (
        <p className="mt-2.5 text-xs text-[#7897a1]">
          {remaining >= 0 ? `${Math.round(remaining)} ${unit} remaining` : `${Math.round(-remaining)} ${unit} over`}
        </p>
      )}
    </article>
  );
}
