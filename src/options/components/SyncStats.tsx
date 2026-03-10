import { useState, useEffect } from "react";
import type { Chain } from "@/types/chain";
import { sendMessage } from "@/shared/messages";
import { formatRelativeTime } from "@/shared/utils";

export function SyncStats() {
  const [stats, setStats] = useState<{
    last_sync_at: number | null;
    syncing: boolean;
    chain_count: number;
  }>({ last_sync_at: null, syncing: false, chain_count: 0 });

  useEffect(() => {
    async function load() {
      const [syncR, chainsR] = await Promise.all([
        sendMessage<{ last_sync_at: number | null; syncing: boolean }>({
          type: "GET_SYNC_STATUS",
        }),
        sendMessage<Chain[]>({ type: "GET_CHAINS" }),
      ]);

      setStats({
        last_sync_at: syncR.ok ? (syncR.data?.last_sync_at ?? null) : null,
        syncing: syncR.ok ? (syncR.data?.syncing ?? false) : false,
        chain_count: chainsR.ok ? (chainsR.data?.length ?? 0) : 0,
      });
    }
    load();
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <p className="text-2xl font-bold text-blue-600">{stats.chain_count}</p>
        <p className="text-xs text-gray-500">Applications</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <p className="text-sm font-medium text-gray-700">
          {stats.last_sync_at
            ? formatRelativeTime(stats.last_sync_at)
            : "Never"}
        </p>
        <p className="text-xs text-gray-500">Last sync</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <div
            className={`h-2 w-2 rounded-full ${stats.syncing ? "bg-blue-500 animate-pulse" : "bg-green-400"}`}
          />
          <p className="text-sm font-medium text-gray-700">
            {stats.syncing ? "Syncing" : "Ready"}
          </p>
        </div>
        <p className="text-xs text-gray-500">Status</p>
      </div>
    </div>
  );
}
