"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileSearch,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  getReportStatusAction,
  getReportValuesAction,
} from "@/lib/actions/reports";
import type {
  MedicalReportResponse,
  ReportExtractedValueResponse,
} from "@/lib/types";

const POLL_INTERVAL_MS = 5000;

const VALUE_STYLES: Record<string, string> = {
  NORMAL: "border-sage/25 bg-sage-soft text-sage",
  LOW: "border-saffron/25 bg-saffron-soft text-saffron",
  HIGH: "border-saffron/25 bg-saffron-soft text-saffron",
  DEFICIENT: "border-garnet/25 bg-garnet-soft text-garnet",
  CRITICAL: "border-garnet/25 bg-garnet-soft text-garnet",
};

function formatReportType(reportType: string) {
  return reportType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReportAnalysisView({
  initialReport,
  initialValues,
}: {
  initialReport: MedicalReportResponse;
  initialValues: ReportExtractedValueResponse[];
}) {
  const [report, setReport] = useState(initialReport);
  const [values, setValues] = useState(initialValues);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const updatedReport = await getReportStatusAction(initialReport.id);
      setReport(updatedReport);
      if (updatedReport.processingStatus === "COMPLETED") {
        setValues(await getReportValuesAction(initialReport.id));
      }
    } catch {
      setRefreshError("Could not refresh the analysis. Check your connection and try again.");
    } finally {
      requestInFlight.current = false;
      setRefreshing(false);
    }
  }, [initialReport.id]);

  useEffect(() => {
    if (report.processingStatus !== "PENDING" && report.processingStatus !== "PROCESSING") return;
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [report.processingStatus, refresh]);

  const normalCount = values.filter((value) => value.status === "NORMAL").length;
  const attentionCount = values.length - normalCount;
  const isInProgress = report.processingStatus === "PENDING" || report.processingStatus === "PROCESSING";

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-12 text-graphite">
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-graphite-70 transition hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
      >
        <ArrowLeft className="h-4 w-4" />
        All reports
      </Link>

      <header className="overflow-hidden rounded-[28px] border border-hairline bg-card shadow-[0_20px_50px_rgba(28,34,28,0.07)]">
        <div className="h-1.5 bg-gradient-to-r from-sage via-[#80b78b] to-[#dbe9d8]" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-sage">
              <FileSearch className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-linen px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-[0.14em] text-graphite-70">
                  {formatReportType(report.reportType)}
                </span>
                <span className={`rounded-full border px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  report.processingStatus === "COMPLETED"
                    ? "border-sage/25 bg-sage-soft text-sage"
                    : report.processingStatus === "FAILED"
                      ? "border-garnet/25 bg-garnet-soft text-garnet"
                      : "border-saffron/25 bg-saffron-soft text-saffron"
                }`}>
                  {report.processingStatus.toLowerCase()}
                </span>
              </div>
              <h1 className="break-words font-display text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">
                {report.originalFilename}
              </h1>
              <p className="mt-2 text-sm text-graphite-70">
                Uploaded <time suppressHydrationWarning>{formatDate(report.uploadedAt)}</time>
                {report.processedAt && <> · Analyzed <time suppressHydrationWarning>{formatDate(report.processedAt)}</time></>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-hairline bg-card px-4 py-2.5 text-sm font-semibold text-graphite transition hover:bg-linen disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {refreshError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-garnet/20 bg-garnet-soft px-4 py-3 text-sm text-garnet">
          <span>{refreshError}</span>
          <button type="button" onClick={() => void refresh()} className="shrink-0 font-semibold underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {isInProgress && (
        <section aria-live="polite" className="flex gap-4 rounded-3xl border border-saffron/25 bg-saffron-soft/50 p-5 sm:p-6">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-saffron">
            {report.processingStatus === "PROCESSING"
              ? <LoaderCircle className="h-5 w-5 animate-spin" />
              : <Clock3 className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">
              {report.processingStatus === "PROCESSING" ? "Analysis in progress" : "Analysis is queued"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-graphite-70">
              We’ll check for results automatically. This can take a little while, especially for scanned PDFs.
            </p>
          </div>
        </section>
      )}

      {report.processingStatus === "FAILED" && (
        <section role="alert" className="flex gap-4 rounded-3xl border border-garnet/20 bg-garnet-soft p-5 sm:p-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-garnet">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold">We couldn’t analyze this report</h2>
            <p className="mt-1 text-sm leading-6 text-graphite-70">
              {report.failureReason ?? "Analysis failed for an unknown reason."}
            </p>
          </div>
        </section>
      )}

      {report.processingStatus === "COMPLETED" && (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:col-span-2 sm:p-6">
              <div className="flex items-center gap-2 text-sage">
                <Sparkles className="h-4 w-4" />
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em]">Report overview</p>
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.035em]">A clearer look at your results</h2>
              <p className="mt-3 text-sm leading-7 text-graphite-70">
                {report.summary || "The analysis completed, but no summary was returned."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-3xl border border-sage/20 bg-sage-soft/60 p-5">
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-70">Values found</p>
                <p className="mt-2 font-display text-3xl font-semibold text-graphite">{values.length}</p>
              </div>
              <div className={`rounded-3xl border p-5 ${attentionCount > 0 ? "border-saffron/20 bg-saffron-soft/50" : "border-hairline bg-card"}`}>
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-70">Flagged by analysis</p>
                <p className="mt-2 font-display text-3xl font-semibold text-graphite">{attentionCount}</p>
              </div>
            </div>
          </section>

          {report.suggestions.length > 0 && (
            <section className="rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-soft text-sage">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold">Things to consider</h2>
                  <p className="text-xs text-graphite-70">Suggestions generated from this report and your profile.</p>
                </div>
              </div>
              <ul className="grid gap-3 md:grid-cols-2">
                {report.suggestions.map((suggestion, index) => (
                  <li key={`${index}-${suggestion}`} className="flex gap-3 rounded-2xl bg-linen/75 p-4 text-sm leading-6 text-graphite-70">
                    <span className="font-data text-xs font-semibold text-sage">{String(index + 1).padStart(2, "0")}</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-sm">
            <div className="flex flex-col gap-2 border-b border-hairline px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
              <div>
                <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">Lab results</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">Extracted values</h2>
              </div>
              {values.length > 0 && (
                <p className="text-xs text-graphite-70">
                  {normalCount} marked normal · {attentionCount} flagged for review
                </p>
              )}
            </div>
            {values.length === 0 ? (
              <div className="px-5 py-10 text-center sm:px-6">
                <p className="font-medium">No values could be confidently extracted.</p>
                <p className="mt-1 text-sm text-graphite-70">Try a clearer scan, and compare with the original report.</p>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {values.map((value, index) => (
                  <ReportValueRow key={`${value.parameterName}-${index}`} value={value} />
                ))}
              </ul>
            )}
          </section>

          <p className="rounded-2xl border border-hairline bg-linen/60 px-4 py-3 text-xs leading-5 text-graphite-70">
            AI-extracted information may be incomplete or inaccurate. It is not a diagnosis or a substitute for reviewing your original report with a qualified healthcare professional.
          </p>
        </>
      )}
    </main>
  );
}

function ReportValueRow({ value }: { value: ReportExtractedValueResponse }) {
  const style = VALUE_STYLES[value.status] ?? "border-hairline bg-linen text-graphite-70";
  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
      <div className="min-w-0">
        <p className="font-medium text-graphite">{value.parameterName}</p>
        {(value.referenceRangeLow != null || value.referenceRangeHigh != null) && (
          <p className="mt-1 text-xs text-graphite-70">
            Reference range: {value.referenceRangeLow ?? "—"}–{value.referenceRangeHigh ?? "—"}
            {value.unit ? ` ${value.unit}` : ""}
          </p>
        )}
      </div>
      <p className="font-data text-lg font-semibold text-graphite sm:text-right">
        {value.value != null ? `${value.value}${value.unit ? ` ${value.unit}` : ""}` : "—"}
      </p>
      <span className={`w-fit rounded-full border px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-[0.1em] ${style}`}>
        {value.status.toLowerCase()}
      </span>
    </li>
  );
}
