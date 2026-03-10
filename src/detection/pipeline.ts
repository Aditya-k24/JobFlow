import { detectEvent } from "./detector";
import { extractEntities } from "./entityExtractor";
import { findOrCreateChain, eventTypeToStatus } from "./chainMatcher";
import { insertEvent } from "@/db/events";
import type { ParsedMessage } from "@/gmail/parser";
import { EXTRACTION_VERSION } from "@/shared/constants";
import { logger } from "@/shared/logger";

/**
 * Main extraction pipeline for a single parsed email.
 * Detects event type → extracts entities → finds/creates chain → saves event.
 */
export async function runExtractionPipeline(
  msgIdInternal: string,
  accountId: string,
  message: ParsedMessage
): Promise<void> {
  // Step 1: Detect event type
  const detection = detectEvent({
    subject: message.subject,
    body_text: message.body_text,
    from_email: message.from_email,
    snippet: message.snippet,
  });

  if (!detection) {
    // No relevant event detected
    return;
  }

  logger.log(
    `Detected ${detection.eventType} (${(detection.confidence * 100).toFixed(0)}%) in: ${message.subject}`
  );

  // Step 2: Extract entities
  const entities = extractEntities(message);

  // Step 3: Map event type to chain status
  const chainStatus = eventTypeToStatus(detection.eventType);

  // Step 4: Find or create chain
  const chainId = await findOrCreateChain({
    accountId,
    fromDomain: message.from_domain,
    companyRaw: entities.company_raw,
    roleRaw: entities.role_raw,
    newStatus: chainStatus,
    eventTime: message.received_at,
    confidence: detection.confidence,
  });

  // Step 5: Save event
  await insertEvent({
    event_id: crypto.randomUUID(),
    chain_id: chainId,
    event_type: detection.eventType,
    event_time: message.received_at,
    due_at: entities.due_at ?? null,
    evidence: detection.evidenceSnippet,
    extracted_entities: {
      company_raw: entities.company_raw,
      role_raw: entities.role_raw,
      recruiter_name: entities.recruiter_name,
      deadline_raw: entities.deadline_raw,
      links: entities.links,
    },
    msg_id_internal: msgIdInternal,
    extraction_version: EXTRACTION_VERSION,
  });

  // Step 6: If we found a deadline-type event but also a due_at, fire a notification
  if (entities.due_at) {
    scheduleDeadlineNotification(
      chainId,
      entities.company_raw ?? "Unknown Company",
      entities.role_raw ?? "Position",
      entities.due_at,
      entities.deadline_raw
    );
  }
}

function scheduleDeadlineNotification(
  chainId: string,
  company: string,
  role: string,
  dueAt: number,
  deadlineRaw?: string
): void {
  const timeUntilDue = dueAt - Date.now();

  // Only schedule if deadline is in the future and within 7 days
  if (timeUntilDue <= 0 || timeUntilDue > 7 * 24 * 60 * 60 * 1000) return;

  // Schedule notification for 24 hours before deadline (or now if less than 24h away)
  const notifyAt = Math.max(Date.now(), dueAt - 24 * 60 * 60 * 1000);
  const delayMinutes = Math.max(0, (notifyAt - Date.now()) / 60000);

  chrome.alarms.create(`deadline_${chainId}_${dueAt}`, {
    delayInMinutes: delayMinutes,
  });

  // Store notification data for when the alarm fires
  const key = `deadline_notif_${chainId}_${dueAt}`;
  chrome.storage.local.set({
    [key]: { company, role, dueAt, deadlineRaw },
  });
}
