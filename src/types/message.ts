export interface MessageIndex {
  msg_id_internal: string; // crypto.randomUUID()
  account_id: string;
  provider_message_id: string; // Gmail message ID
  provider_thread_id: string; // Gmail thread ID
  rfc5322_message_id: string | null; // Message-ID header
  from_domain: string; // e.g. "greenhouse.io"
  from_email: string;
  subject_text: string;
  received_at: number; // Unix ms
  snippet: string;
  processed: boolean;
}
