import type { Chain } from "@/types/chain";
import type { AppEvent } from "@/types/event";
import type { AccountConnection } from "@/types/account";

// Outgoing messages (popup/options → background)
export type ExtensionMessage =
  | { type: "TRIGGER_SYNC" }
  | { type: "GET_CHAINS" }
  | { type: "GET_EVENTS"; chainId: string }
  | { type: "GET_UPCOMING_DEADLINES" }
  | { type: "GET_ACCOUNT" }
  | { type: "DISCONNECT_GMAIL" }
  | { type: "DELETE_ALL_DATA" }
  | { type: "GET_SYNC_STATUS" };

// Response shapes
export interface MessageResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export type GetChainsResponse = MessageResponse<Chain[]>;
export type GetEventsResponse = MessageResponse<AppEvent[]>;
export type GetAccountResponse = MessageResponse<AccountConnection | null>;
export type SyncStatusResponse = MessageResponse<{
  last_sync_at: number | null;
  syncing: boolean;
}>;

export function sendMessage<T = unknown>(
  message: ExtensionMessage
): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}
