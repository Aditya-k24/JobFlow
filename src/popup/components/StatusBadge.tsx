import type { ChainStatus } from "@/types/chain";

const STATUS_CONFIG: Record<
  ChainStatus,
  { label: string; className: string }
> = {
  APPLIED: { label: "Applied", className: "bg-indigo-100 text-indigo-700" },
  ASSESSMENT: {
    label: "Assessment",
    className: "bg-amber-100 text-amber-700",
  },
  INTERVIEWING: {
    label: "Interviewing",
    className: "bg-blue-100 text-blue-700",
  },
  OFFER: { label: "Offer", className: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-600" },
  GHOSTED: { label: "Ghosted", className: "bg-gray-100 text-gray-500" },
  WITHDRAWN: {
    label: "Withdrawn",
    className: "bg-gray-100 text-gray-500",
  },
};

export function StatusBadge({ status }: { status: ChainStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.APPLIED;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
