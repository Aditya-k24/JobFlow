import { useState, useEffect, useCallback } from "react";
import type { Chain } from "@/types/chain";
import { sendMessage } from "@/shared/messages";

export function useChains() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChains = useCallback(async () => {
    try {
      const response = await sendMessage<Chain[]>({ type: "GET_CHAINS" });
      if (response.ok && response.data) {
        setChains(response.data);
      } else {
        setError(response.error ?? "Failed to load chains");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChains();

    // Re-fetch when sync completes (detected via storage change)
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ("glanceai_last_sync_at" in changes || "glanceai_syncing" in changes) {
        fetchChains();
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.local.onChanged.removeListener(handleStorageChange);
  }, [fetchChains]);

  return { chains, loading, error, refetch: fetchChains };
}
