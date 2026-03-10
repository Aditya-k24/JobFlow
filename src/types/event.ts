export type EventType =
  | "APPLICATION_RECEIVED"
  | "REJECTION"
  | "ASSESSMENT_INVITE"
  | "INTERVIEW_INVITE"
  | "DEADLINE"
  | "OFFER"
  | "FOLLOW_UP"
  | "OTHER";

export interface AppEvent {
  event_id: string;
  chain_id: string;
  event_type: EventType;
  event_time: number; // Unix ms (when email arrived)
  due_at: number | null; // Unix ms (parsed deadline if applicable)
  evidence: string; // matched snippet
  extracted_entities: {
    company_raw?: string;
    role_raw?: string;
    recruiter_name?: string;
    deadline_raw?: string;
    links?: string[];
  };
  msg_id_internal: string; // FK to MessageIndex
  extraction_version: number;
}
