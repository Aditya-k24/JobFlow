import { getDb } from "./client";
import type { AppEvent } from "@/types/event";

export async function getEvent(eventId: string): Promise<AppEvent | undefined> {
  const db = await getDb();
  return db.get("events", eventId);
}

export async function getEventsByChain(chainId: string): Promise<AppEvent[]> {
  const db = await getDb();
  const events = await db.getAllFromIndex("events", "by_chain", chainId);
  return events.sort((a, b) => b.event_time - a.event_time);
}

export async function getUpcomingDeadlines(withinMs: number = 7 * 24 * 60 * 60 * 1000): Promise<AppEvent[]> {
  const db = await getDb();
  const now = Date.now();
  const cutoff = now + withinMs;

  // Get all events with due_at set
  const allEvents = await db.getAll("events");
  return allEvents
    .filter((e) => e.due_at !== null && e.due_at >= now && e.due_at <= cutoff)
    .sort((a, b) => (a.due_at ?? 0) - (b.due_at ?? 0));
}

export async function getRecentEvents(limit = 20): Promise<AppEvent[]> {
  const db = await getDb();
  const all = await db.getAll("events");
  return all.sort((a, b) => b.event_time - a.event_time).slice(0, limit);
}

export async function insertEvent(event: AppEvent): Promise<void> {
  const db = await getDb();
  await db.put("events", event);
}

export async function deleteEventsByChain(chainId: string): Promise<void> {
  const db = await getDb();
  const events = await db.getAllFromIndex("events", "by_chain", chainId);
  const tx = db.transaction("events", "readwrite");
  await Promise.all([
    ...events.map((e) => tx.store.delete(e.event_id)),
    tx.done,
  ]);
}

export async function clearAllEvents(): Promise<void> {
  const db = await getDb();
  await db.clear("events");
}
