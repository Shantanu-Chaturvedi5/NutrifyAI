"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
} from "lucide-react";
import { deleteReportAction, getReportStatusAction } from "@/lib/actions/reports";
import { StatusBadge } from "@/components/StatusBadge";
import type { MedicalReportResponse } from "@/lib/types";

const POLL_INTERVAL_MS = 5000;
const PAGE_SIZE = 5;

function formatReportType(reportType: string) {
  return reportType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ReportsList({ initialReports }: { initialReports: MedicalReportResponse[] }) {
  const [reports, setReports] = useState(initialReports);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setReports(initialReports);
  }, [initialReports]);

  useEffect(() => {
    const inProgress = reports.some(
      (r) => r.processingStatus === "PENDING" || r.processingStatus === "PROCESSING"
    );
    if (!inProgress) return;

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        reports.map((r) =>
          r.processingStatus === "PENDING" || r.processingStatus === "PROCESSING"
            ? getReportStatusAction(r.id)
            : Promise.resolve(r)
        )
      );
      setReports(updated);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [reports]);

  const pageCount = Math.ceil(reports.length / PAGE_SIZE);
  const visibleReports = reports.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const completedCount = reports.filter((report) => report.processingStatus === "COMPLETED").length;

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  async function handleDelete(id: number, filename: string) {
    if (!window.confirm(`Delete "${filename}"? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteReportAction(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-hairline/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sage" />
            <h2 className="font-display text-xl font-semibold tracking-tight text-graphite">Your reports</h2>
          </div>
          <p className="mt-1 text-xs text-graphite-70">View, analyze, and manage your uploaded reports.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 font-data text-[10px] text-graphite-45">
        <span>{reports.length} {reports.length === 1 ? "report" : "reports"} total</span>
        <span className="h-1 w-1 rounded-full bg-hairline" />
        <span>{completedCount} analyzed</span>
      </div>

      {reports.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-linen/30 px-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-soft text-sage">
            <FileText className="h-6 w-6" />
          </span>
          <h3 className="mt-4 font-display text-base font-semibold text-graphite">Your report library is ready</h3>
          <p className="mt-1 max-w-xs text-xs leading-5 text-graphite-70">
            Upload a lab report to see its processing status, extracted values, and summary here.
          </p>
          <a href="#upload-report" className="mt-4 text-xs font-semibold text-sage hover:underline">
            Upload your first report
          </a>
        </div>
      ) : (
        <ul className="divide-y divide-hairline/60">
          {visibleReports.map((report) => (
            <li key={report.id} className="group flex min-w-0 items-center gap-2 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-soft/70 text-sage">
                <FileText className="h-5 w-5" />
              </span>
              <Link
                href={`/reports/${report.id}`}
                className="min-w-0 flex-1 rounded-lg px-1 py-1 transition hover:bg-linen/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
              >
                <span className="block truncate text-xs font-semibold text-graphite">{report.originalFilename}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-graphite-45">
                  <span>{formatReportType(report.reportType)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(report.uploadedAt).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
                {report.processingStatus === "FAILED" && report.failureReason && (
                  <span className="mt-1 block truncate text-[10px] text-garnet">{report.failureReason}</span>
                )}
              </Link>
              <span className="hidden shrink-0 sm:block">
                <StatusBadge status={report.processingStatus} />
              </span>
              <button
                type="button"
                onClick={() => handleDelete(report.id, report.originalFilename)}
                disabled={deletingId === report.id}
                aria-label={`Delete ${report.originalFilename}`}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-graphite-45 transition hover:bg-garnet-soft hover:text-garnet disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">{deletingId === report.id ? "Deleting…" : "Delete report"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {visibleReports.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-hairline/70 pt-3">
          <p className="text-[10px] text-graphite-45">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, reports.length)} of {reports.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={currentPage === 0}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-graphite-70 transition hover:bg-linen disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-8 text-center font-data text-[10px] text-graphite-70">
              {currentPage + 1} / {Math.max(1, pageCount)}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))}
              disabled={currentPage >= pageCount - 1}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline text-graphite-70 transition hover:bg-linen disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
