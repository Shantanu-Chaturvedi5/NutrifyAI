"use client";

import { useEffect, useState } from "react";
import {
  deleteMenuAction,
  getMenuStatusAction,
  type RestaurantMenuResponse,
} from "@/lib/actions/restaurant-menu";
import { UploadMenuForm } from "@/components/UploadMenuForm";

const POLL_INTERVAL_MS = 5000;

export function RestaurantMenuView({ initialMenus }: { initialMenus: RestaurantMenuResponse[] }) {
  const [menus, setMenus] = useState(initialMenus);
  const [selectedId, setSelectedId] = useState<number | null>(
    initialMenus.find((m) => m.processingStatus === "COMPLETED")?.id ?? null
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setMenus(initialMenus);
  }, [initialMenus]);

  useEffect(() => {
    const inProgress = menus.filter((m) => m.processingStatus === "PENDING" || m.processingStatus === "PROCESSING");
    if (inProgress.length === 0) return;

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        menus.map((m) =>
          m.processingStatus === "PENDING" || m.processingStatus === "PROCESSING"
            ? getMenuStatusAction(m.id)
            : Promise.resolve(m)
        )
      );
      setMenus(updated);
      // Auto-select the first menu that just finished, if nothing's selected yet.
      if (selectedId === null) {
        const justCompleted = updated.find((m) => m.processingStatus === "COMPLETED");
        if (justCompleted) setSelectedId(justCompleted.id);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [menus, selectedId]);

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this scanned menu? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await deleteMenuAction(id);
      setMenus((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
    } finally {
      setDeletingId(null);
    }
  }

  const selectedMenu = menus.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
      <div className="space-y-5">
        <section className="rounded-[26px] border border-[var(--menu-border)] bg-card/90 p-4 shadow-[0_18px_32px_rgba(70,48,30,0.07)] backdrop-blur-sm sm:p-6">
          <div className="mb-5">
            <p className="font-data text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--menu-accent)]">Start with a menu</p>
            <h2 className="mt-1 font-display text-2xl tracking-[-0.04em] text-graphite">Upload a menu photo</h2>
            <p className="mt-1 text-sm text-graphite-70">We’ll read the dishes and organize the results for you.</p>
          </div>
          <UploadMenuForm />
          <p className="mt-4 rounded-2xl bg-[var(--menu-soft)] p-4 text-sm leading-6 text-graphite-70">
            Nutrition details are estimates based on how each dish is typically prepared. Restaurants don’t usually publish measured nutrition facts, so use these as a guide.
          </p>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-[var(--menu-border)] bg-card/85 shadow-[0_14px_28px_rgba(70,48,30,0.05)] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <div>
              <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--menu-accent)]">Saved uploads</p>
              <h2 className="mt-1 font-display text-xl tracking-tight text-graphite">Your menus</h2>
            </div>
            <span className="rounded-full bg-[var(--menu-soft)] px-3 py-1 font-data text-xs text-[var(--menu-accent)]">{menus.length}</span>
          </div>
          {menus.length === 0 ? (
            <p className="px-5 py-6 text-sm text-graphite-70">No menus yet. Upload a menu photo to get started.</p>
          ) : (
            <ul className="divide-y divide-hairline">
              {menus.map((m) => (
                <li key={m.id} className="flex items-center gap-2 px-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    aria-pressed={selectedId === m.id}
                    className={`my-1 flex-1 rounded-xl px-3 py-3 text-left transition ${selectedId === m.id ? "bg-[var(--menu-soft)]" : "hover:bg-linen/70"}`}
                  >
                    <p className="font-medium text-graphite">{m.restaurantName ?? `Menu #${m.id}`}</p>
                    <p className="mt-1 font-data text-xs text-graphite-70" suppressHydrationWarning>
                      {m.processingStatus} · {new Date(m.uploadedAt).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="mr-3 shrink-0 text-xs font-semibold text-critical underline underline-offset-2 disabled:opacity-50"
                  >
                    {deletingId === m.id ? "Deleting…" : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="min-h-64 rounded-[26px] border border-[var(--menu-border)] bg-[var(--menu-paper)]/95 p-4 shadow-[0_18px_32px_rgba(70,48,30,0.07)] backdrop-blur-sm sm:p-6">
        {!selectedMenu && (
          <div className="flex min-h-56 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--menu-soft)] text-[var(--menu-accent)]">
              <span className="font-display text-2xl">✦</span>
            </div>
            <h2 className="font-display text-2xl text-graphite">Your menu, thoughtfully organized</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-graphite-70">Choose a saved menu to explore its dishes and estimated nutrition.</p>
          </div>
        )}

        {selectedMenu && selectedMenu.processingStatus !== "COMPLETED" && (
          <div className="rounded-2xl border border-[var(--menu-border)] bg-card/70 px-5 py-5 text-sm text-graphite">
            <p className="font-display text-xl">{selectedMenu.restaurantName ?? `Menu #${selectedMenu.id}`}</p>
            <p className="mt-2 text-graphite-70">
              {selectedMenu.processingStatus === "FAILED"
                ? selectedMenu.failureReason ?? "We couldn’t analyze this menu."
                : "We’re reading this menu now. This page will update automatically."}
            </p>
          </div>
        )}

        {selectedMenu && selectedMenu.processingStatus === "COMPLETED" && (
          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--menu-border)] pb-4">
              <div>
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--menu-accent)]">Menu highlights</p>
                <h2 className="mt-1 font-display text-3xl tracking-[-0.05em] text-graphite">
                  {selectedMenu.restaurantName ?? `Menu #${selectedMenu.id}`}
                </h2>
              </div>
              <span className="rounded-full bg-[var(--menu-soft)] px-3 py-1 font-data text-xs text-[var(--menu-accent)]">
                {selectedMenu.items.length} dishes
              </span>
            </div>
            <div className="space-y-3">
              {[...selectedMenu.items]
                .sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended))
                .map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 ${item.isRecommended ? "border-[var(--menu-recommended-border)] bg-[var(--menu-recommended)]" : "border-hairline bg-card/75"}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 font-data text-xs text-[var(--menu-accent)]">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-medium text-graphite">{item.itemName}</p>
                          {item.isRecommended && (
                            <span className="shrink-0 rounded-full bg-[var(--menu-soft)] px-2.5 py-1 font-data text-[10px] font-semibold uppercase tracking-wider text-[var(--menu-accent)]">
                              Recommended
                            </span>
                          )}
                        </div>
                        {(item.estimatedCalories != null || item.estimatedProteinG != null) && (
                          <p className="mt-2 font-data text-xs text-graphite-70">
                            {item.estimatedCalories != null ? `~${Math.round(item.estimatedCalories)} kcal` : ""}
                            {item.estimatedCalories != null && item.estimatedProteinG != null ? " · " : ""}
                            {item.estimatedProteinG != null ? `~${Math.round(item.estimatedProteinG)}g protein` : ""}
                            {" · estimated"}
                          </p>
                        )}
                        {item.recommendationReason && (
                          <p className="mt-2 text-sm leading-5 text-graphite-70">{item.recommendationReason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}