import type { DBSchema } from "idb";
import type { Chain } from "@/types/chain";
import type { AppEvent } from "@/types/event";
import type { AccountConnection } from "@/types/account";
import type { MessageIndex } from "@/types/message";

export interface EmailChainDB extends DBSchema {
  chains: {
    key: string;
    value: Chain;
    indexes: {
      by_status: string;
      by_last_event: number;
      by_account: string;
    };
  };
  events: {
    key: string;
    value: AppEvent;
    indexes: {
      by_chain: string;
      by_due_at: number;
      by_event_time: number;
    };
  };
  account_connections: {
    key: string;
    value: AccountConnection;
  };
  message_index: {
    key: string;
    value: MessageIndex;
    indexes: {
      by_provider_id: string;
      by_thread: string;
      by_processed: number; // 0 | 1 stored as number for IDB indexing
      by_account: string;
    };
  };
}
