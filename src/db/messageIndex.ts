import { getDb } from "./client";
import type { MessageIndex } from "@/types/message";

export async function getMessage(msgId: string): Promise<MessageIndex | undefined> {
  const db = await getDb();
  return db.get("message_index", msgId);
}

export async function getMessageByProviderId(
  providerMessageId: string
): Promise<MessageIndex | undefined> {
  const db = await getDb();
  return db.getFromIndex("message_index", "by_provider_id", providerMessageId);
}

export async function getUnprocessedMessages(limit = 50): Promise<MessageIndex[]> {
  const db = await getDb();
  // IndexedDB doesn't natively support LIMIT on index queries, so we fetch all unprocessed
  const all = await db.getAllFromIndex("message_index", "by_processed", 0);
  return all
    .sort((a, b) => a.received_at - b.received_at) // oldest first
    .slice(0, limit);
}

export async function saveMessage(message: MessageIndex): Promise<void> {
  const db = await getDb();
  // Store processed as 0/1 for IDB index compatibility
  await db.put("message_index", {
    ...message,
    processed: message.processed ? (1 as unknown as boolean) : (0 as unknown as boolean),
  });
}

export async function markMessageProcessed(msgIdInternal: string): Promise<void> {
  const db = await getDb();
  const msg = await db.get("message_index", msgIdInternal);
  if (!msg) return;
  await db.put("message_index", {
    ...msg,
    processed: 1 as unknown as boolean,
  });
}

export async function countUnprocessed(): Promise<number> {
  const db = await getDb();
  const all = await db.getAllFromIndex("message_index", "by_processed", 0);
  return all.length;
}

export async function clearAllMessages(): Promise<void> {
  const db = await getDb();
  await db.clear("message_index");
}
