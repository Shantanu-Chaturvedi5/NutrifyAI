import Link from "next/link";
import { authedFetchReadOnly } from "@/lib/backend";
import { ReportAnalysisView } from "@/components/ReportAnalysisView";
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

  return <ReportAnalysisView initialReport={report} initialValues={values} />;
}