import { useState, useEffect } from "react";
import type { Chain } from "@/types/chain";
import type { AccountConnection } from "@/types/account";
import { sendMessage } from "@/shared/messages";
import { EmptyState } from "./components/EmptyState";
import { ChainList } from "./components/ChainList";
import { ChainView } from "./components/ChainView";
import { DeadlineBanner } from "./components/DeadlineBanner";
import { SyncButton } from "./components/SyncButton";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useChains } from "./hooks/useChains";
import { useDeadlines } from "./hooks/useDeadlines";
import { useSyncStatus } from "./hooks/useSyncStatus";

export default function App() {
  const [account, setAccount] = useState<AccountConnection | null | undefined>(
    undefined // undefined = still loading
  );
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const { chains, loading: chainsLoading, refetch } = useChains();
  const { deadlines } = useDeadlines();
  const syncStatus = useSyncStatus();

  useEffect(() => {
    sendMessage<AccountConnection | null>({ type: "GET_ACCOUNT" }).then((r) => {
      setAccount(r.ok ? (r.data ?? null) : null);
    });
  }, []);

  // Show loading state during initial auth check
  if (account === undefined) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Not connected
  if (!account) {
    return <EmptyState />;
  }

  // Chain detail view
  if (selectedChain) {
    return (
      <ChainView chain={selectedChain} onBack={() => setSelectedChain(null)} />
    );
  }

  // Main view
  const chainMap = new Map(chains.map((c) => [c.chain_id, c]));
  const nextDeadline = deadlines[0];
  const nextDeadlineChain = nextDeadline
    ? chainMap.get(nextDeadline.chain_id)
    : undefined;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
            <svg
              className="h-3.5 w-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-gray-900">EmailChain</h1>
          {chains.length > 0 && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {chains.filter((c) => !["REJECTED", "WITHDRAWN", "GHOSTED"].includes(c.status)).length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <SyncButton
            lastSyncAt={syncStatus.last_sync_at}
            syncing={syncStatus.syncing}
            onSynced={refetch}
          />
          <button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open settings"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Deadline banner */}
      {nextDeadline && (
        <div className="pt-2">
          <DeadlineBanner deadline={nextDeadline} chain={nextDeadlineChain} />
        </div>
      )}

      {/* Chain list */}
      {chainsLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <ChainList
          chains={chains}
          onSelectChain={(id) => {
            const chain = chainMap.get(id);
            if (chain) setSelectedChain(chain);
          }}
        />
      )}
    </div>
  );
}
