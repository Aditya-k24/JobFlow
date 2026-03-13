import { useState, useEffect, useCallback } from "react";
import type { Chain, ChainStatus } from "@/types/chain";
import type { AppEvent } from "@/types/event";
import type { AccountConnection } from "@/types/account";
import { sendMessage } from "@/shared/messages";
import { formatRelativeTime, formatDeadline } from "@/shared/utils";

// ─── Priority ordering ───────────────────────────────────────────────────────
const PRIORITY: Record<ChainStatus, number> = {
  OFFER: 0,
  INTERVIEWING: 1,
  ASSESSMENT: 2,
  APPLIED: 3,
  GHOSTED: 4,
  REJECTED: 5,
  WITHDRAWN: 6,
};

// ─── Status visual config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ChainStatus,
  { label: string; accent: string; bg: string; border: string; glow: string; dot: string }
> = {
  INTERVIEWING: {
    label: "Interview",
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/40",
    glow: "card-glow-interview",
    dot: "bg-violet-400",
  },
  ASSESSMENT: {
    label: "Assessment",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    glow: "card-glow-assessment",
    dot: "bg-amber-400",
  },
  OFFER: {
    label: "Offer",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    glow: "card-glow-offer",
    dot: "bg-emerald-400",
  },
  APPLIED: {
    label: "Applied",
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
    glow: "card-glow-applied",
    dot: "bg-indigo-400",
  },
  GHOSTED: {
    label: "Ghosted",
    accent: "text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-600/30",
    glow: "",
    dot: "bg-gray-500",
  },
  REJECTED: {
    label: "Rejected",
    accent: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "",
    dot: "bg-red-400",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    accent: "text-gray-500",
    bg: "bg-gray-500/10",
    border: "border-gray-600/20",
    glow: "",
    dot: "bg-gray-500",
  },
};

// Pipeline stages shown in each card's progress bar
const PIPELINE_STAGES: ChainStatus[] = ["APPLIED", "ASSESSMENT", "INTERVIEWING", "OFFER"];


// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [account, setAccount] = useState<AccountConnection | null | undefined>(undefined);
  const [chains, setChains] = useState<Chain[]>([]);
  const [events, setEvents] = useState<Record<string, AppEvent[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [accR, chainsR, syncR] = await Promise.all([
      sendMessage<AccountConnection | null>({ type: "GET_ACCOUNT" }),
      sendMessage<Chain[]>({ type: "GET_CHAINS" }),
      sendMessage<{ last_sync_at: number | null; syncing: boolean }>({ type: "GET_SYNC_STATUS" }),
    ]);
    setAccount(accR.ok ? (accR.data ?? null) : null);
    if (chainsR.ok && chainsR.data) {
      const sorted = [...chainsR.data].sort(
        (a, b) => PRIORITY[a.status] - PRIORITY[b.status] || b.last_event_at - a.last_event_at
      );
      setChains(sorted);
    }
    if (syncR.ok && syncR.data) {
      setLastSync(syncR.data.last_sync_at);
      setSyncing(syncR.data.syncing);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ("offerbound_last_sync_at" in changes || "offerbound_syncing" in changes) load();
    };
    chrome.storage.local.onChanged.addListener(onChange);
    return () => chrome.storage.local.onChanged.removeListener(onChange);
  }, [load]);

  const loadEvents = async (chainId: string) => {
    if (events[chainId]) return;
    const r = await sendMessage<AppEvent[]>({ type: "GET_EVENTS", chainId });
    if (r.ok && r.data) setEvents((prev) => ({ ...prev, [chainId]: r.data! }));
  };

  const toggleExpand = (chainId: string) => {
    if (expanded === chainId) {
      setExpanded(null);
    } else {
      setExpanded(chainId);
      loadEvents(chainId);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await sendMessage({ type: "TRIGGER_SYNC" });
    setTimeout(load, 1000);
  };

  // ─── Empty / unauthenticated state ─────────────────────────────────────────
  if (account === undefined || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-800 border-t-violet-400" />
      </div>
    );
  }

  if (!account) {
    return <NotConnected />;
  }

  const active = chains.filter((c) => !["REJECTED", "WITHDRAWN", "GHOSTED"].includes(c.status));
  const closed = chains.filter((c) => ["REJECTED", "WITHDRAWN", "GHOSTED"].includes(c.status));

  return (
    <div className="flex min-h-screen flex-col bg-[#0f1117] text-white">
      {/* Header */}
      <Header
        email={account.email}
        activeCount={active.length}
        syncing={syncing}
        lastSync={lastSync}
        onSync={handleSync}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
        {chains.length === 0 ? (
          <EmptyChains />
        ) : (
          <>
            {active.map((chain, idx) => (
              <ChainCard
                key={chain.chain_id}
                chain={chain}
                events={events[chain.chain_id]}
                expanded={expanded === chain.chain_id}
                onToggle={() => toggleExpand(chain.chain_id)}
                animDelay={idx * 50}
              />
            ))}

            {closed.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 px-1 text-xs font-medium uppercase tracking-widest text-gray-600">
                  Closed · {closed.length}
                </p>
                {closed.map((chain, idx) => (
                  <ChainCard
                    key={chain.chain_id}
                    chain={chain}
                    events={events[chain.chain_id]}
                    expanded={expanded === chain.chain_id}
                    onToggle={() => toggleExpand(chain.chain_id)}
                    animDelay={(active.length + idx) * 50}
                    muted
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({
  email,
  activeCount,
  syncing,
  lastSync,
  onSync,
}: {
  email: string;
  activeCount: number;
  syncing: boolean;
  lastSync: number | null;
  onSync: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0f1117]/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">OfferBound</span>
              <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-300">
                {activeCount} active
              </span>
            </div>
            <p className="text-[10px] text-gray-600">
              {email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {lastSync && (
            <span className="text-[10px] text-gray-600">
              {formatRelativeTime(lastSync)}
            </span>
          )}
          <button
            onClick={onSync}
            disabled={syncing}
            className="rounded-md p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 disabled:opacity-40 transition-colors"
            title="Sync now"
          >
            <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="rounded-md p-1.5 text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
            title="Settings"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Chain Card ───────────────────────────────────────────────────────────────
function ChainCard({
  chain,
  events,
  expanded,
  onToggle,
  animDelay,
  muted = false,
}: {
  chain: Chain;
  events?: AppEvent[];
  expanded: boolean;
  onToggle: () => void;
  animDelay: number;
  muted?: boolean;
}) {
  const cfg = STATUS_CONFIG[chain.status];
  const initials = chain.canonical_company
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const nextDeadline = events?.find((e) => e.due_at && e.due_at > Date.now());

  return (
    <div
      className={`fade-in mb-2.5 overflow-hidden rounded-xl border ${cfg.border} ${cfg.glow} transition-all duration-200 ${muted ? "opacity-50" : ""}`}
      style={{ animationDelay: `${animDelay}ms` }}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className={`w-full ${cfg.bg} px-4 py-3.5 text-left transition-colors hover:brightness-110`}
      >
        <div className="flex items-center gap-3">
          {/* Avatar with colored left accent */}
          <div className="relative flex-shrink-0">
            <div className={`absolute -left-4 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r ${cfg.dot}`} />
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${cfg.bg} border ${cfg.border}`}>
              {initials || "?"}
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-white">
                {chain.canonical_company}
              </p>
              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.accent} border ${cfg.border}`}>
                {cfg.label}
              </span>
            </div>
            {chain.role_title && (
              <p className="truncate text-xs text-gray-400">{chain.role_title}</p>
            )}
            <p className="text-[10px] text-gray-600">
              {formatRelativeTime(chain.last_event_at)}
            </p>
          </div>

          {/* Chevron */}
          <svg
            className={`h-4 w-4 flex-shrink-0 text-gray-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Pipeline progress bar */}
        <PipelineBar status={chain.status} cfg={cfg} />

        {/* Deadline alert */}
        {nextDeadline?.due_at && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5">
            <span className="text-xs">⏰</span>
            <span className="text-xs font-medium text-amber-300">
              Due {formatDeadline(nextDeadline.due_at)}
            </span>
          </div>
        )}
      </button>

      {/* Expanded timeline */}
      {expanded && (
        <div className="border-t border-white/5 bg-[#0d1018] px-4 py-3">
          {!events ? (
            <div className="flex justify-center py-3">
              <div className="h-4 w-4 animate-spin rounded-full border border-gray-700 border-t-gray-400" />
            </div>
          ) : events.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-600">No events recorded.</p>
          ) : (
            <EventTimeline events={events} cfg={cfg} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Pipeline bar ─────────────────────────────────────────────────────────────
function PipelineBar({
  status,
  cfg,
}: {
  status: ChainStatus;
  cfg: typeof STATUS_CONFIG[ChainStatus];
}) {
  const currentIdx = PIPELINE_STAGES.indexOf(status);

  return (
    <div className="mt-3 flex items-center gap-1">
      {PIPELINE_STAGES.map((stage, idx) => {
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <div key={stage} className="flex flex-1 items-center gap-1">
            <div className="flex-1"><div
                className={`h-1 rounded-full transition-all duration-500 ${
                  isDone
                    ? `${cfg.dot} opacity-60`
                    : isActive
                    ? cfg.dot
                    : "bg-white/10"
                }`}
              />
            </div>
            {idx < PIPELINE_STAGES.length - 1 && (
              <div className={`h-1 w-1 rounded-full ${isDone || isActive ? `${cfg.dot} opacity-40` : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Event timeline ───────────────────────────────────────────────────────────
const HIGH_PRIORITY_EVENTS = new Set([
  "INTERVIEW_INVITE",
  "OFFER",
  "ASSESSMENT_INVITE",
]);

function formatEventDate(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " at " +
    date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function EventTimeline({
  events,
  cfg,
}: {
  events: AppEvent[];
  cfg: typeof STATUS_CONFIG[ChainStatus];
}) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  return (
    <ol className="py-1">
      {events.map((event, idx) => {
        const isHighPriority = HIGH_PRIORITY_EVENTS.has(event.event_type);
        const isOpen = expandedEvent === event.event_id;
        const label = event.event_type
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const entities = event.extracted_entities ?? {};
        const hasLinks = entities.links && entities.links.length > 0;
        const hasDetails =
          event.evidence ||
          entities.recruiter_name ||
          entities.role_raw ||
          entities.deadline_raw ||
          hasLinks;

        return (
          <li key={event.event_id} className="relative flex gap-4">
            {/* Left column: dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={`relative z-10 mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full transition-all ${
                  isHighPriority ? cfg.dot : "bg-gray-600"
                } ${isOpen ? "scale-125 ring-2 ring-white/20" : ""}`}
              />
              {idx < events.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-white/10" />
              )}
            </div>

            {/* Right column */}
            <div className={`min-w-0 flex-1 ${idx < events.length - 1 ? "pb-4" : "pb-1"}`}>
              {/* Clickable header row */}
              <button
                onClick={() => hasDetails && setExpandedEvent(isOpen ? null : event.event_id)}
                className={`flex w-full items-center justify-between gap-2 text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
              >
                <div>
                  <p className={`text-sm font-medium leading-snug ${isHighPriority ? "text-white" : "text-gray-400"}`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {formatEventDate(event.event_time)}
                  </p>
                  {event.due_at && event.due_at > Date.now() && (
                    <p className="mt-0.5 text-xs font-medium text-amber-400">
                      ⏰ Due {formatDeadline(event.due_at)}
                    </p>
                  )}
                </div>
                {hasDetails && (
                  <svg
                    className={`h-3.5 w-3.5 flex-shrink-0 text-gray-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {/* Expanded detail panel */}
              {isOpen && hasDetails && (
                <div className={`mt-2 rounded-lg border ${cfg.border} bg-white/[0.03] p-3 space-y-2`}>
                  {entities.recruiter_name && (
                    <DetailRow icon="👤" label="From" value={entities.recruiter_name} />
                  )}
                  {entities.role_raw && (
                    <DetailRow icon="💼" label="Role" value={entities.role_raw} />
                  )}
                  {entities.company_raw && (
                    <DetailRow icon="🏢" label="Company" value={entities.company_raw} />
                  )}
                  {event.due_at && (
                    <DetailRow
                      icon="⏰"
                      label="Deadline"
                      value={new Date(event.due_at).toLocaleString([], {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                      highlight
                    />
                  )}
                  {entities.deadline_raw && (
                    <DetailRow icon="📋" label="Extracted text" value={entities.deadline_raw} mono />
                  )}
                  {hasLinks && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-600">
                        🔗 Links
                      </p>
                      {entities.links!.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className={`block truncate text-xs ${cfg.accent} hover:underline`}
                        >
                          {link.replace(/^https?:\/\//, "")}
                        </a>
                      ))}
                    </div>
                  )}
                  {event.evidence && (
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                        📧 Email snippet
                      </p>
                      <p className="text-xs leading-relaxed text-gray-500 italic">
                        "{event.evidence}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight = false,
  mono = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-600">
          {label}{" "}
        </span>
        <span className={`text-xs ${highlight ? "font-medium text-amber-400" : "text-gray-300"} ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function EmptyChains() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20">
        <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-400">No applications tracked yet</p>
      <p className="mt-1 text-xs text-gray-600">Sync will pick up job emails automatically</p>
    </div>
  );
}

function NotConnected() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-[#0f1117]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-900/40">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">Connect your Gmail</h2>
      <p className="mb-6 text-sm text-gray-500 leading-relaxed">
        OfferBound tracks job application emails and builds a timeline of your search — all on device.
      </p>
      <button
        onClick={() => chrome.runtime.openOptionsPage()}
        className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition-all"
      >
        Connect Gmail →
      </button>
    </div>
  );
}
