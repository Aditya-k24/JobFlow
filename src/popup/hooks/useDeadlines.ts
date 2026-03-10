import { useState, useEffect } from "react";
import type { AppEvent } from "@/types/event";
import { sendMessage } from "@/shared/messages";

export function useDeadlines() {
  const [deadlines, setDeadlines] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const response = await sendMessage<AppEvent[]>({
          type: "GET_UPCOMING_DEADLINES",
        });
        if (response.ok && response.data) {
          setDeadlines(response.data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { deadlines, loading };
}
