import { useState } from "react";
import { sendMessage } from "@/shared/messages";
import { formatRelativeTime } from "@/shared/utils";

interface SyncButtonProps {
  lastSyncAt: number | null;
  syncing: boolean;
  onSynced: () => void;
}

export function SyncButton({ lastSyncAt, syncing, onSynced }: SyncButtonProps) {
  const [localSyncing, setLocalSyncing] = useState(false);

  const isSyncing = syncing || localSyncing;

  const handleSync = async () => {
    if (isSyncing) return;
    setLocalSyncing(true);
    try {
      await sendMessage({ type: "TRIGGER_SYNC" });
      onSynced();
    } finally {
      setLocalSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {lastSyncAt && (
        <span className="text-xs text-gray-400">
          Synced {formatRelativeTime(lastSyncAt)}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        aria-label={isSyncing ? "Syncing…" : "Sync now"}
      >
        <svg
          className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isSyncing ? "Syncing…" : "Sync"}
      </button>
    </div>
  );
}
