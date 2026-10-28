"use client";

import { useState } from "react";
import { logProductAction } from "@/lib/actions/intake-tracking";

export function LogIntakeButton({ productId }: { productId: number }) {
  const [state, setState] = useState<"idle" | "logging" | "logged" | "error">("idle");

  async function handleClick() {
    setState("logging");
    try {
      await logProductAction(productId);
      setState("logged");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "logging" || state === "logged"}
      className="rounded-lg border border-hairline px-3 py-1 text-sm font-semibold text-graphite hover:bg-linen-deep disabled:opacity-70"
    >
      {state === "idle" && "+ Log to today's intake"}
      {state === "logging" && "Logging…"}
      {state === "logged" && "Logged ✓"}
      {state === "error" && "Couldn't log — try again"}
    </button>
  );
}