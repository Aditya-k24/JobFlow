export type ChainStatus =
  | "APPLIED"
  | "ASSESSMENT"
  | "INTERVIEWING"
  | "OFFER"
  | "REJECTED"
  | "GHOSTED"
  | "WITHDRAWN";

export interface Chain {
  chain_id: string;
  canonical_company: string;
  role_title: string;
  status: ChainStatus;
  last_event_at: number; // Unix ms
  confidence: number; // 0.0–1.0
  created_at: number; // Unix ms
  account_id: string;
}

// Status ordering for state machine (higher index = later stage)
export const STATUS_ORDER: ChainStatus[] = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
  "GHOSTED",
  "WITHDRAWN",
];
