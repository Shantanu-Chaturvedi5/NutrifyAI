"use client";

import { useActionState } from "react";
import { createReviewAction, upsertRatingAction, type ActionState } from "@/lib/actions/reviews";

const initialState: ActionState = {};

export function ReviewForm({ productId }: { productId: number }) {
  const action = createReviewAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="reviewText"
        required
        rows={3}
        placeholder="What did you think of this product?"
        className="w-full rounded-lg border border-hairline bg-card px-3 py-2 text-graphite placeholder:text-graphite-45 focus:outline-none focus:ring-2 focus:ring-garnet/40"
      />
      {state.error && <p className="text-sm text-garnet">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-hairline px-4 py-1.5 text-sm font-semibold text-graphite hover:bg-garnet hover:text-white hover:border-garnet disabled:opacity-50"
      >
        {pending ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

const RATING_FIELDS: [name: string, label: string][] = [
  ["tasteRating", "Taste"],
  ["healthinessRating", "Healthiness"],
  ["digestibilityRating", "Digestibility"],
  ["satisfactionRating", "Satisfaction"],
];

export function RatingForm({ productId }: { productId: number }) {
  const action = upsertRatingAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {RATING_FIELDS.map(([name, label]) => (
        <div key={name} className="flex items-center justify-between gap-3">
          <label htmlFor={name} className="text-sm text-graphite">{label}</label>
          <select
            id={name} name={name} required defaultValue="3"
            className="rounded-lg border border-hairline bg-card px-2 py-1 text-sm text-graphite"
          >
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      ))}
      {state.error && <p className="text-sm text-garnet">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg border border-hairline px-4 py-1.5 text-sm font-semibold text-graphite hover:bg-garnet hover:text-white hover:border-garnet disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save rating"}
      </button>
    </form>
  );
}