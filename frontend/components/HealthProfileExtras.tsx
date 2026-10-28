"use client";

import { useActionState } from "react";
import {
  addAllergyAction,
  addConditionAction,
  addGoalAction,
  type ActionState,
} from "@/lib/actions/health-profile";

const initialState: ActionState = {};

const CONDITION_OPTIONS = [
  ["DIABETES", "Diabetes"],
  ["HYPERTENSION", "Hypertension"],
  ["HEART_DISEASE", "Heart disease"],
  ["THYROID_DISORDER", "Thyroid disorder"],
  ["PCOS", "PCOS"],
  ["OBESITY", "Obesity"],
  ["KIDNEY_DISEASE", "Kidney disease"],
  ["FOOD_ALLERGY", "Food allergy"],
];

const GOAL_OPTIONS = [
  ["WEIGHT_LOSS", "Weight loss"],
  ["FAT_LOSS", "Fat loss"],
  ["MUSCLE_GAIN", "Muscle gain"],
  ["WEIGHT_GAIN", "Weight gain"],
  ["MAINTENANCE", "Maintenance"],
  ["HEART_HEALTH", "Better heart health"],
  ["BLOOD_SUGAR_CONTROL", "Better blood sugar control"],
];

const fieldClasses = "rounded-lg border border-hairline bg-card px-2 py-1.5 text-sm text-graphite";
const buttonClasses =
  "rounded-lg border border-hairline px-3 py-1.5 text-sm font-semibold text-graphite hover:bg-garnet hover:text-white hover:border-garnet disabled:opacity-50";

export function AddConditionForm() {
  const [state, formAction, pending] = useActionState(addConditionAction, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <select name="conditionCode" required className={fieldClasses}>
        {CONDITION_OPTIONS.map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={buttonClasses}>
        {pending ? "Adding…" : "Add condition"}
      </button>
      {state.error && <span className="text-sm text-garnet">{state.error}</span>}
    </form>
  );
}

export function AddGoalForm() {
  const [state, formAction, pending] = useActionState(addGoalAction, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <select name="goalCode" required className={fieldClasses}>
        {GOAL_OPTIONS.map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
      <button type="submit" disabled={pending} className={buttonClasses}>
        {pending ? "Adding…" : "Add goal"}
      </button>
      {state.error && <span className="text-sm text-garnet">{state.error}</span>}
    </form>
  );
}

export function AddAllergyForm() {
  const [state, formAction, pending] = useActionState(addAllergyAction, initialState);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input
        name="allergyName" required placeholder="e.g. Peanuts"
        className={`${fieldClasses} placeholder:text-graphite-45 focus:outline-none focus:ring-2 focus:ring-garnet/40`}
      />
      <button type="submit" disabled={pending} className={buttonClasses}>
        {pending ? "Adding…" : "Add allergy"}
      </button>
      {state.error && <span className="text-sm text-garnet">{state.error}</span>}
    </form>
  );
}