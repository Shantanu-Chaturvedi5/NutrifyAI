import Link from "next/link";
import { authedFetchReadOnly } from "@/lib/backend";
import { FactsPanel } from "@/components/FactsPanel";
import { StatusBadge } from "@/components/StatusBadge";
import type { MedicalReportResponse, ReportExtractedValueResponse } from "@/lib/types";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reportId = Number(id);

  const report = await authedFetchReadOnly<MedicalReportResponse>(`/reports/${reportId}`);
  const values =
    report.processingStatus === "COMPLETED"
      ? await authedFetchReadOnly<ReportExtractedValueResponse[]>(`/reports/${reportId}/values`)
      : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/reports" className="text-sm font-semibold text-teal underline">
          &larr; Back to reports
        </Link>
        <h1 className="mt-2 font-display text-2xl font-black uppercase tracking-tight">
          {report.originalFilename}
        </h1>
        <p className="text-sm text-ink-soft">
          {report.reportType} · uploaded {new Date(report.uploadedAt).toLocaleDateString()}
          {report.processedAt && ` · analyzed ${new Date(report.processedAt).toLocaleDateString()}`}
        </p>
        <div className="mt-2">
          <StatusBadge status={report.processingStatus} />
        </div>
      </div>

      {(report.processingStatus === "PENDING" || report.processingStatus === "PROCESSING") && (
        <p className="border-2 border-ink bg-paper p-4 text-sm text-ink-soft">
          Still analyzing — this can take anywhere from a few seconds to a minute depending on
          the file and the AI provider. This page doesn&rsquo;t auto-refresh; reload to check again.
        </p>
      )}

      {report.processingStatus === "FAILED" && (
        <p className="border-2 border-critical bg-critical-soft px-4 py-3 text-sm text-critical">
          {report.failureReason ?? "Analysis failed for an unknown reason."}
        </p>
      )}

      {report.processingStatus === "COMPLETED" && (
        <>
          {report.summary && (
            <div className="border-2 border-ink bg-paper p-4">
              <p className="mb-1 text-sm font-semibold">Summary</p>
              <p className="text-sm text-ink-soft">{report.summary}</p>
            </div>
          )}

          {report.suggestions.length > 0 && (
            <div className="border-2 border-ink bg-paper p-4">
              <p className="mb-1 text-sm font-semibold">Suggested for you</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-soft">
                {report.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          <FactsPanel title="Extracted values">
            {values.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-soft">
                No parameters could be confidently extracted from this report.
              </p>
            ) : (
              values.map((v, i) => (
                <div key={i} className="flex items-center justify-between gap-4 px-4 py-2">
                  <div>
                    <p className="font-medium">{v.parameterName}</p>
                    {(v.referenceRangeLow != null || v.referenceRangeHigh != null) && (
                      <p className="text-xs text-ink-soft">
                        Reference: {v.referenceRangeLow ?? "—"}–{v.referenceRangeHigh ?? "—"}
                        {v.unit ? ` ${v.unit}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-data text-sm">
                      {v.value != null ? `${v.value}${v.unit ? ` ${v.unit}` : ""}` : "—"}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                </div>
              ))
            )}
          </FactsPanel>

          <p className="text-xs text-ink-soft">
            AI-extracted from your uploaded file — not a substitute for reading the original
            report or talking to a doctor about the results.
          </p>
        </>
      )}
    </div>
  );
}