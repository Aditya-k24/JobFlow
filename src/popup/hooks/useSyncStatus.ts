import { useState, useEffect } from "react";
import { sendMessage } from "@/shared/messages";

export interface SyncStatus {
  last_sync_at: number | null;
  syncing: boolean;
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    last_sync_at: null,
    syncing: false,
  });

  useEffect(() => {
    async function fetch() {
      const response = await sendMessage<SyncStatus>({ type: "GET_SYNC_STATUS" });
      if (response.ok && response.data) {
        setStatus(response.data);
      }
    }
    fetch();

    const handleChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if ("glanceai_syncing" in changes || "glanceai_last_sync_at" in changes) {
        fetch();
      }
    };
    chrome.storage.local.onChanged.addListener(handleChange);
    return () => chrome.storage.local.onChanged.removeListener(handleChange);
  }, []);

  return status;
}
