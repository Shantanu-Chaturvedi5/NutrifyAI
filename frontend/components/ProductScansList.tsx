"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteScanAction, getScanStatusAction } from "@/lib/actions/product-scans";
import { StatusBadge } from "@/components/StatusBadge";
import type { ProductScanResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

export function ProductScansList({ initialScans }: { initialScans: ProductScanResponse[] }) {
  const [scans, setScans] = useState(initialScans);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // useState(initialScans) only reads that value on first mount — this
  // component stays mounted across the upload form's revalidatePath, so
  // without this, a freshly-uploaded scan never appears until something
  // else (like a tab switch) actually remounts the component.
  useEffect(() => {
    setScans(initialScans);
  }, [initialScans]);

  useEffect(() => {
    const inProgress = scans.filter(
      (s) => s.processingStatus === "PENDING" || s.processingStatus === "PROCESSING"
    );
    if (inProgress.length === 0) return;

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        scans.map((s) =>
          s.processingStatus === "PENDING" || s.processingStatus === "PROCESSING"
            ? getScanStatusAction(s.id)
            : Promise.resolve(s)
        )
      );
      setScans(updated);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [scans]);

  async function handleDelete(id: number) {
    if (!window.confirm(`Delete scan #${id}? This won't delete the product it created, if any. This can't be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteScanAction(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (scans.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-hairline bg-linen/60 px-4 py-8 text-center text-sm text-graphite-70">
        No scans yet — upload a label photo to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-card/70">
      {scans.map((s) => {
        const content = (
          <div className="flex flex-1 items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-graphite">Scan #{s.id}</p>
              <p className="font-data text-xs text-graphite-70" suppressHydrationWarning>
                uploaded {new Date(s.uploadedAt).toLocaleString()}
              </p>
              {s.processingStatus === "FAILED" && s.failureReason && (
                <p className="mt-1 text-xs text-critical">{s.failureReason}</p>
              )}
              {s.processingStatus === "COMPLETED" && (
                <p className="mt-1 text-xs font-medium text-sage">View analyzed product →</p>
              )}
            </div>
            <StatusBadge status={s.processingStatus} />
          </div>
        );

        return (
          <li key={s.id} className="flex items-center gap-2">
            {s.processingStatus === "COMPLETED" && s.productId ? (
              <Link href={`/products/${s.productId}`} className="flex flex-1 transition-colors hover:bg-linen-deep">
                {content}
              </Link>
            ) : (
              content
            )}
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              aria-label={`Delete scan #${s.id}`}
              className="mr-4 shrink-0 text-xs font-semibold text-critical underline disabled:opacity-50"
            >
              {deletingId === s.id ? "Deleting…" : "Delete"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}