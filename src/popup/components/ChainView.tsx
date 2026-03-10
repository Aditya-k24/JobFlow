import { useState, useEffect } from "react";
import type { Chain } from "@/types/chain";
import type { AppEvent } from "@/types/event";
import { StatusBadge } from "./StatusBadge";
import { sendMessage } from "@/shared/messages";
import { formatRelativeTime, formatDeadline } from "@/shared/utils";

const EVENT_ICONS: Record<string, string> = {
  APPLICATION_RECEIVED: "📨",
  REJECTION: "❌",
  ASSESSMENT_INVITE: "📝",
  INTERVIEW_INVITE: "🎙",
  DEADLINE: "⏰",
  OFFER: "🎉",
  FOLLOW_UP: "📧",
  OTHER: "📌",
};

const EVENT_LABELS: Record<string, string> = {
  APPLICATION_RECEIVED: "Application Received",
  REJECTION: "Rejection",
  ASSESSMENT_INVITE: "Assessment Invite",
  INTERVIEW_INVITE: "Interview Invite",
  DEADLINE: "Deadline",
  OFFER: "Offer",
  FOLLOW_UP: "Follow Up",
  OTHER: "Update",
};

interface ChainViewProps {
  chain: Chain;
  onBack: () => void;
}

export function ChainView({ chain, onBack }: ChainViewProps) {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sendMessage<AppEvent[]>({ type: "GET_EVENTS", chainId: chain.chain_id })
      .then((r) => {
        if (r.ok && r.data) setEvents(r.data);
      })
      .finally(() => setLoading(false));
  }, [chain.chain_id]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-3">
        <button
          onClick={onBack}
          className="rounded p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Go back"
        >
          <svg
            className="h-4 w-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-gray-900">
              {chain.canonical_company}
            </h2>
            <StatusBadge status={chain.status} />
          </div>
          {chain.role_title && (
            <p className="truncate text-xs text-gray-500">{chain.role_title}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {loading ? (
          <div className="py-4 text-center text-xs text-gray-400">
            Loading…
          </div>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">
            No events recorded yet.
          </p>
        ) : (
          <ol className="relative space-y-0" aria-label="Application timeline">
            {events.map((event, idx) => (
              <li key={event.event_id} className="relative pl-6">
                {/* Timeline line */}
                {idx < events.length - 1 && (
                  <div
                    className="absolute left-2.5 top-5 bottom-0 w-px bg-gray-200"
                    aria-hidden="true"
                  />
                )}

                {/* Dot */}
                <div
                  className="absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-gray-200 text-xs"
                  aria-hidden="true"
                >
                  {EVENT_ICONS[event.event_type] ?? "📌"}
                </div>

                <div className="pb-4">
                  <p className="text-xs font-medium text-gray-900">
                    {EVENT_LABELS[event.event_type] ?? "Update"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(event.event_time)}
                  </p>
                  {event.due_at && (
                    <p className="mt-0.5 text-xs font-medium text-amber-600">
                      Due: {formatDeadline(event.due_at)}
                    </p>
                  )}
                  {event.evidence && (
                    <p className="mt-1 line-clamp-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-500 italic">
                      "{event.evidence}"
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
