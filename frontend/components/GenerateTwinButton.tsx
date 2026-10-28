"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { generateNutritionTwinAction } from "@/lib/actions/nutrition-twin";

export function GenerateTwinButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await generateNutritionTwinAction();
            setError(result.error ?? null);
          })
        }
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(28,34,28,0.16)] transition hover:bg-garnet disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} aria-hidden="true" />
        {isPending ? "Analyzing your reports…" : "Regenerate from latest reports"}
      </button>
      {error && <p role="alert" className="mt-2 max-w-xs text-sm text-critical">{error}</p>}
    </div>
  );
}
