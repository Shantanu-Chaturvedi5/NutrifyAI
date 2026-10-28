import { getTodaySummaryAction } from "@/lib/actions/intake-tracking";
import { IntakeTrackerView } from "@/components/IntakeTrackerView";

export default async function TrackPage() {
  const summary = await getTodaySummaryAction();

  return (
    <IntakeTrackerView initialSummary={summary} />
  );
}