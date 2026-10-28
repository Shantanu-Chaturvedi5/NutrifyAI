"use client";

import { useState } from "react";
import { addProductToCartAction } from "@/lib/actions/grocery";

export function AddToGroceryButton({ productId }: { productId: number }) {
  const [state, setState] = useState<"idle" | "adding" | "added" | "error">("idle");

  async function handleClick() {
    setState("adding");
    try {
      await addProductToCartAction(productId);
      setState("added");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "adding" || state === "added"}
      className="rounded-lg border border-hairline px-3 py-1 text-sm font-semibold text-graphite hover:bg-linen-deep disabled:opacity-70"
    >
      {state === "idle" && "+ Add to grocery list"}
      {state === "adding" && "Adding…"}
      {state === "added" && "Added ✓"}
      {state === "error" && "Couldn't add — try again"}
    </button>
  );
}