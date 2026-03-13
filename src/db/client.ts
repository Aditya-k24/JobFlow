import { openDB, type IDBPDatabase } from "idb";
import type { OfferBoundDB } from "./schema";
import { DB_NAME, DB_VERSION } from "@/shared/constants";

let dbInstance: IDBPDatabase<OfferBoundDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<OfferBoundDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfferBoundDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      switch (oldVersion) {
        case 0: {
          // Chains store
          const chainsStore = db.createObjectStore("chains", {
            keyPath: "chain_id",
          });
          chainsStore.createIndex("by_status", "status");
          chainsStore.createIndex("by_last_event", "last_event_at");
          chainsStore.createIndex("by_account", "account_id");

          // Events store
          const eventsStore = db.createObjectStore("events", {
            keyPath: "event_id",
          });
          eventsStore.createIndex("by_chain", "chain_id");
          eventsStore.createIndex("by_due_at", "due_at");
          eventsStore.createIndex("by_event_time", "event_time");

          // Account connections store
          db.createObjectStore("account_connections", {
            keyPath: "account_id",
          });

          // Message index store
          const msgStore = db.createObjectStore("message_index", {
            keyPath: "msg_id_internal",
          });
          msgStore.createIndex("by_provider_id", "provider_message_id", {
            unique: true,
          });
          msgStore.createIndex("by_thread", "provider_thread_id");
          msgStore.createIndex("by_processed", "processed");
          msgStore.createIndex("by_account", "account_id");
          break;
        }
        // Future migrations go here as additional cases
      }
    },
    blocked() {
      console.warn("[OfferBound] DB upgrade blocked by another tab");
    },
    blocking() {
      dbInstance?.close();
      dbInstance = null;
    },
    terminated() {
      dbInstance = null;
    },
  });

  return dbInstance;
}
