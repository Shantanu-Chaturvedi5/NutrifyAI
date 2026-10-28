const STATUS_STYLES: Record<string, string> = {
  COMPLETED: "bg-sage-soft text-sage border-sage",
  NORMAL: "bg-sage-soft text-sage border-sage",
  PENDING: "bg-saffron-soft text-saffron border-saffron",
  PROCESSING: "bg-saffron-soft text-saffron border-saffron",
  LOW: "bg-saffron-soft text-saffron border-saffron",
  HIGH: "bg-saffron-soft text-saffron border-saffron",
  FAILED: "bg-garnet-soft text-garnet border-garnet",
  DEFICIENT: "bg-garnet-soft text-garnet border-garnet",
  CRITICAL: "bg-garnet-soft text-garnet border-garnet",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-linen-deep text-graphite-70 border-hairline";
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 font-data text-xs font-semibold uppercase ${style}`}>
      {status}
    </span>
  );
}