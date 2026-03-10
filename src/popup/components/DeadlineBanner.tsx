import type { AppEvent } from "@/types/event";
import type { Chain } from "@/types/chain";
import { formatDeadline } from "@/shared/utils";

interface DeadlineBannerProps {
  deadline: AppEvent;
  chain: Chain | undefined;
}

export function DeadlineBanner({ deadline, chain }: DeadlineBannerProps) {
  if (!deadline.due_at) return null;

  const timeUntilDue = deadline.due_at - Date.now();
  const isUrgent = timeUntilDue < 24 * 60 * 60 * 1000; // < 24h

  return (
    <div
      className={`mx-3 mb-2 rounded-lg p-3 ${
        isUrgent
          ? "border border-red-200 bg-red-50"
          : "border border-amber-200 bg-amber-50"
      }`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-lg" aria-hidden="true">
          {isUrgent ? "🔴" : "⏰"}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isUrgent ? "text-red-600" : "text-amber-600"
            }`}
          >
            {isUrgent ? "Due soon" : "Upcoming deadline"}
          </p>
          <p className="truncate text-sm font-medium text-gray-900">
            {chain?.canonical_company ?? "Unknown"}
            {chain?.role_title ? ` — ${chain.role_title}` : ""}
          </p>
          <p
            className={`text-xs ${isUrgent ? "text-red-600 font-medium" : "text-amber-700"}`}
          >
            {formatDeadline(deadline.due_at)}
          </p>
          {deadline.evidence && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              "{deadline.evidence}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
