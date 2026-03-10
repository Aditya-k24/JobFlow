export type ProviderType = "gmail";

export interface AccountConnection {
  account_id: string; // crypto.randomUUID()
  provider_type: ProviderType;
  provider_user_key: string; // Gmail user email
  email: string;
  scopes_granted: string[];
  connected_at: number; // Unix ms
  last_sync_at: number | null;
  last_history_id: string | null;
}
