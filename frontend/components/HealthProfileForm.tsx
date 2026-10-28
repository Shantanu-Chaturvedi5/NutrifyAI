"use client";

import { useActionState } from "react";
import { upsertHealthProfileAction, type ActionState } from "@/lib/actions/health-profile";
import type { HealthProfileResponse } from "@/lib/types";

const initialState: ActionState = {};

const input =
  "w-full rounded-xl border border-hairline bg-linen px-3 py-2.5 text-graphite focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30";
const label = "mb-1.5 block text-xs font-semibold text-graphite";

export function HealthProfileForm({ profile }: { profile: HealthProfileResponse | null }) {
  const [state, formAction, pending] = useActionState(upsertHealthProfileAction, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="age" className={label}>Age</label>
        <input id="age" name="age" type="number" min={1} max={130} defaultValue={profile?.age ?? ""} className={input} />
      </div>

      <div>
        <label htmlFor="gender" className={label}>Gender</label>
        <select id="gender" name="gender" defaultValue={profile?.gender ?? ""} className={input}>
          <option value="">—</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label htmlFor="weightKg" className={label}>Weight (kg)</label>
        <input id="weightKg" name="weightKg" type="number" step="0.1" min={1} defaultValue={profile?.weightKg ?? ""} className={input} />
      </div>

      <div>
        <label htmlFor="heightCm" className={label}>Height (cm)</label>
        <input id="heightCm" name="heightCm" type="number" step="0.1" min={1} defaultValue={profile?.heightCm ?? ""} className={input} />
      </div>

      <div>
        <label htmlFor="activityLevel" className={label}>Activity level</label>
        <select id="activityLevel" name="activityLevel" defaultValue={profile?.activityLevel ?? ""} className={input}>
          <option value="">—</option>
          <option value="SEDENTARY">Sedentary</option>
          <option value="LIGHT">Light</option>
          <option value="MODERATE">Moderate</option>
          <option value="ACTIVE">Active</option>
          <option value="VERY_ACTIVE">Very active</option>
        </select>
      </div>

      <div>
        <label htmlFor="dietaryPreference" className={label}>Dietary preference</label>
        <select id="dietaryPreference" name="dietaryPreference" defaultValue={profile?.dietaryPreference ?? ""} className={input}>
          <option value="">—</option>
          <option value="VEGETARIAN">Vegetarian</option>
          <option value="VEGAN">Vegan</option>
          <option value="NON_VEGETARIAN">Non-vegetarian</option>
          <option value="EGGETARIAN">Eggetarian</option>
          <option value="PESCATARIAN">Pescatarian</option>
        </select>
      </div>

      {state.error && (
        <p className="rounded-xl border border-garnet bg-garnet-soft px-3 py-2 text-sm text-garnet sm:col-span-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-graphite px-4 py-2.5 font-semibold text-linen transition hover:bg-sage hover:text-white disabled:opacity-50 sm:col-span-2"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}