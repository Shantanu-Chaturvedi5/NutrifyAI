"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ChefHat,
  Clock3,
  Flame,
  Leaf,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  generateDietPlanAction,
  getDietPlanStatusAction,
  type ActionState,
  type DietPlanResponse,
  type MealType,
  type PlanType,
} from "@/lib/actions/diet-plan";

const initialState: ActionState = {};
const POLL_INTERVAL_MS = 5000;

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string; description: string }[] = [
  { value: "ONE_DAY", label: "1 day", description: "A simple place to start" },
  { value: "SEVEN_DAY", label: "7 days", description: "A week of inspiration" },
  { value: "THIRTY_DAY", label: "30 days", description: "A month of meal ideas" },
];

const MEAL_DETAILS: Record<MealType, { label: string; icon: LucideIcon; color: string; tile: string }> = {
  BREAKFAST: { label: "Breakfast", icon: Leaf, color: "text-saffron", tile: "bg-saffron-soft" },
  LUNCH: { label: "Lunch", icon: Utensils, color: "text-sage", tile: "bg-sage-soft" },
  DINNER: { label: "Dinner", icon: ChefHat, color: "text-garnet", tile: "bg-garnet-soft" },
  SNACK: { label: "Snack", icon: Activity, color: "text-water-blue", tile: "bg-linen-deep" },
};

export function DietPlanView({ initialPlan }: { initialPlan: DietPlanResponse | null }) {
  const [plan, setPlan] = useState(initialPlan);
  const [state, formAction, pending] = useActionState(generateDietPlanAction, initialState);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    setPlan(initialPlan);
    setSelectedDay(1);
  }, [initialPlan]);

  useEffect(() => {
    if (!plan || (plan.generationStatus !== "PENDING" && plan.generationStatus !== "PROCESSING")) return;

    const interval = setInterval(async () => {
      const updated = await getDietPlanStatusAction(plan.id);
      setPlan(updated);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [plan?.id, plan?.generationStatus]);

  const generateForm = (
    <form action={formAction} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-graphite">How far ahead should we plan?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {PLAN_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="group flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-card px-4 py-3 transition hover:border-sage has-[:checked]:border-sage has-[:checked]:bg-sage-soft"
            >
              <input
                type="radio"
                name="planType"
                value={option.value}
                defaultChecked={option.value === "SEVEN_DAY"}
                className="mt-1 accent-sage"
              />
              <span>
                <span className="block text-sm font-semibold text-graphite">{option.label}</span>
                <span className="mt-0.5 block text-xs text-graphite-70">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-garnet/20 bg-garnet-soft px-4 py-3 text-sm text-garnet">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-graphite px-5 py-2.5 text-sm font-semibold text-linen shadow-sm transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {pending ? "Preparing your plan…" : plan ? "Create a new plan" : "Create my meal plan"}
      </button>
    </form>
  );

  if (!plan) {
    return (
      <section className="grid gap-6 rounded-[24px] border border-hairline bg-card p-5 shadow-[0_1px_2px_rgba(28,34,28,0.04),0_18px_40px_-24px_rgba(28,34,28,0.18)] sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
        <div className="flex flex-col justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-soft text-sage">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-medium text-graphite">Your table is waiting.</h2>
          <p className="mt-2 text-sm leading-6 text-graphite-70">
            Choose a plan length to get personalized meal ideas and daily nutrition targets.
            Your calorie and protein goals are based on your health profile.
          </p>
          <p className="mt-4 text-xs leading-5 text-graphite-45">
            Keep your profile up to date for recommendations that fit you better.
          </p>
        </div>
        <div className="rounded-2xl bg-linen p-5 sm:p-6">
          {generateForm}
        </div>
      </section>
    );
  }

  const selectedPlanDay = plan.days.find((day) => day.dayNumber === selectedDay) ?? plan.days[0];
  const dayCalories = selectedPlanDay?.meals.reduce(
    (total, meal) => total + (meal.calories ?? 0),
    0
  );
  const hasDayCalories = selectedPlanDay?.meals.some((meal) => meal.calories != null) ?? false;
  const isGenerating = plan.generationStatus === "PENDING" || plan.generationStatus === "PROCESSING";
  const isFailed = plan.generationStatus === "FAILED";

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[24px] border border-hairline bg-linen-deep shadow-[0_1px_2px_rgba(28,34,28,0.04),0_18px_40px_-24px_rgba(28,34,28,0.18)]">
        <div className="pointer-events-none absolute -right-8 -top-12 -z-10 h-48 w-48 rounded-full bg-sage-soft/50 blur-3xl" />
        <div className="h-1 bg-gradient-to-r from-sage via-saffron to-garnet" />
        <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-soft text-sage ring-1 ring-sage/10">
            <CalendarDays className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-data text-[10px] uppercase tracking-wider ${isFailed ? "bg-garnet-soft text-garnet" : isGenerating ? "bg-saffron-soft text-saffron" : "bg-sage-soft text-sage"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isGenerating ? "animate-pulse bg-saffron" : isFailed ? "bg-garnet" : "bg-sage"}`} />
                {isGenerating ? "In the works" : isFailed ? "Needs attention" : "Your plan"}
              </span>
              <span className="font-data text-[10px] uppercase tracking-wider text-graphite-45">
                Plan № {String(plan.id).padStart(4, "0")}
              </span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-medium text-graphite sm:text-3xl">
              {PLAN_TYPE_OPTIONS.find((option) => option.value === plan.planType)?.label ?? plan.planType} of good choices
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-graphite-70" suppressHydrationWarning>
              <CalendarDays className="h-4 w-4 text-sage" aria-hidden="true" />
              {plan.startDate} <span aria-hidden="true">—</span> {plan.endDate}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[330px]">
            <TargetStat icon={Flame} label="Daily energy" value={plan.calorieTarget != null ? `${Math.round(plan.calorieTarget)}` : "—"} unit={plan.calorieTarget != null ? "kcal" : ""} />
            <TargetStat icon={Activity} label="Protein goal" value={plan.proteinTarget != null ? `${Math.round(plan.proteinTarget)}` : "—"} unit={plan.proteinTarget != null ? "g / day" : ""} />
          </div>
        </div>
      </section>

      {isGenerating && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-saffron/20 bg-saffron-soft px-4 py-4 text-sm text-graphite-70">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-saffron" aria-hidden="true" />
          <span>
            <span className="block font-semibold text-graphite">Your meals are being prepared.</span>
            This usually takes under a minute. This page will update automatically.
          </span>
        </div>
      )}

      {plan.generationStatus === "FAILED" && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-garnet/20 bg-garnet-soft px-4 py-4 text-sm text-garnet">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{plan.failureReason ?? "We couldn't generate your plan. Please try again."}</span>
        </div>
      )}

      {plan.generationStatus === "COMPLETED" && plan.days.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.18em] text-sage">The menu</p>
              <h2 className="mt-1 font-display text-2xl font-medium text-graphite">Your meals, day by day</h2>
            </div>
            {selectedPlanDay && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 font-data text-xs text-graphite-70 ring-1 ring-hairline">
                <Flame className="h-3.5 w-3.5 text-saffron" aria-hidden="true" />
                {hasDayCalories ? Math.round(dayCalories ?? 0) : "—"} kcal planned
              </p>
            )}
          </div>

          <div role="tablist" aria-label="Choose a day" className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {plan.days.map((day) => (
              <button
                key={day.dayNumber}
                id={`diet-day-tab-${day.dayNumber}`}
                type="button"
                role="tab"
                aria-selected={selectedPlanDay?.dayNumber === day.dayNumber}
                aria-controls="diet-day-panel"
                onClick={() => setSelectedDay(day.dayNumber)}
                className={`min-w-[4.5rem] flex-1 rounded-full border px-4 py-2 text-center text-sm font-semibold transition ${
                  selectedPlanDay?.dayNumber === day.dayNumber
                    ? "border-graphite bg-graphite text-linen shadow-sm"
                    : "border-hairline bg-card text-graphite-70 hover:border-sage hover:text-sage"
                }`}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>

          {selectedPlanDay && (
            <div
              id="diet-day-panel"
              role="tabpanel"
              aria-labelledby={`diet-day-tab-${selectedPlanDay.dayNumber}`}
              className="grid gap-4 xl:grid-cols-3"
            >
              {selectedPlanDay.meals.length > 0 ? (
                selectedPlanDay.meals.map((meal, index) => (
                  <MealCard key={`${selectedPlanDay.dayNumber}-${meal.mealType}-${index}`} meal={meal} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-hairline bg-card px-5 py-8 text-center text-sm text-graphite-70">
                  No meals are listed for this day.
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {plan.generationStatus === "COMPLETED" && plan.days.length === 0 && (
        <div className="rounded-2xl border border-dashed border-hairline bg-card px-5 py-8 text-center">
          <p className="font-display text-xl text-graphite">Your plan is ready, but the menu is empty.</p>
          <p className="mt-2 text-sm text-graphite-70">Try creating a new plan to get fresh meal ideas.</p>
        </div>
      )}

      <details className="group rounded-[24px] border border-hairline bg-card shadow-[0_1px_2px_rgba(28,34,28,0.04)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[24px] bg-sage-soft/35 px-5 py-5 marker:hidden sm:px-7 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold text-graphite">Want a different plan?</span>
            <span className="mt-0.5 block text-xs text-graphite-70">Generate a new set of meal ideas.</span>
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage transition group-open:rotate-45">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
        </summary>
        <div className="border-t border-hairline bg-linen/60 px-5 py-5 sm:px-6">
          {generateForm}
        </div>
      </details>
    </div>
  );
}

function TargetStat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl bg-linen px-4 py-3">
      <div className="flex items-center gap-1.5 text-graphite-70">
        <Icon className="h-3.5 w-3.5 text-sage" aria-hidden="true" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1 font-data text-xl font-medium text-graphite">
        {value}<span className="ml-1 text-[10px] font-normal text-graphite-70">{unit}</span>
      </p>
    </div>
  );
}

function MealCard({ meal }: { meal: DietPlanResponse["days"][number]["meals"][number] }) {
  const details = MEAL_DETAILS[meal.mealType];
  const Icon = details.icon;
  const nutrients = [
    { label: "Protein", value: meal.proteinG, unit: "g" },
    { label: "Carbs", value: meal.carbsG, unit: "g" },
    { label: "Fat", value: meal.fatG, unit: "g" },
    { label: "Fiber", value: meal.fiberG, unit: "g" },
    { label: "Sugar", value: meal.sugarG, unit: "g" },
    { label: "Sat. fat", value: meal.saturatedFatG, unit: "g" },
    { label: "Sodium", value: meal.sodiumMg, unit: "mg" },
  ].filter((nutrient): nutrient is { label: string; value: number; unit: string } => nutrient.value != null);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-hairline bg-card shadow-[0_1px_2px_rgba(28,34,28,0.04),0_14px_30px_-24px_rgba(28,34,28,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_34px_-20px_rgba(28,34,28,0.24)]">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className={`font-data text-[10px] font-medium uppercase tracking-[0.16em] ${details.color}`}>
            {details.label}
          </p>
          {meal.calories != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-saffron-soft px-2.5 py-1 font-data text-[11px] text-graphite">
              <Flame className="h-3 w-3 text-saffron" aria-hidden="true" />
              {Math.round(meal.calories)} kcal
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-3">
          <div aria-hidden="true" className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${details.tile}`}>
            <span className="absolute -right-3 -top-3 h-12 w-12 rounded-full border border-current opacity-15" />
            <span className="absolute -bottom-5 -left-4 h-16 w-16 rounded-full border border-current opacity-15" />
            <Icon className={`relative h-10 w-10 ${details.color}`} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-medium leading-snug text-graphite">{meal.name}</h3>
            {meal.description && (
              <p className="mt-1.5 line-clamp-4 text-xs leading-5 text-graphite-70">{meal.description}</p>
            )}
          </div>
        </div>
      </div>
      {nutrients.length > 0 && (
        <dl className="mt-auto grid grid-cols-4 gap-x-2 gap-y-3 border-t border-hairline bg-linen/45 px-4 py-3 sm:px-5">
          {nutrients.map((nutrient) => (
            <div key={nutrient.label}>
              <dt className="text-[10px] text-graphite-45">{nutrient.label}</dt>
              <dd className="mt-0.5 font-data text-xs font-medium text-graphite">
                {Math.round(nutrient.value)} <span className="text-[10px] font-normal text-graphite-70">{nutrient.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
