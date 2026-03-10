import { getDb } from "./client";
import type { AccountConnection } from "@/types/account";

export async function getAccount(accountId: string): Promise<AccountConnection | undefined> {
  const db = await getDb();
  return db.get("account_connections", accountId);
}

export async function getFirstAccount(): Promise<AccountConnection | null> {
  const db = await getDb();
  const all = await db.getAll("account_connections");
  return all[0] ?? null;
}

export async function getAllAccounts(): Promise<AccountConnection[]> {
  const db = await getDb();
  return db.getAll("account_connections");
}

export async function saveAccount(account: AccountConnection): Promise<void> {
  const db = await getDb();
  await db.put("account_connections", account);
}

export async function updateAccountSyncState(
  accountId: string,
  lastSyncAt: number,
  lastHistoryId: string | null
): Promise<void> {
  const db = await getDb();
  const account = await db.get("account_connections", accountId);
  if (!account) return;
  await db.put("account_connections", {
    ...account,
    last_sync_at: lastSyncAt,
    last_history_id: lastHistoryId,
  });
}

export async function deleteAccount(accountId: string): Promise<void> {
  const db = await getDb();
  await db.delete("account_connections", accountId);
}

export async function clearAllAccounts(): Promise<void> {
  const db = await getDb();
  await db.clear("account_connections");
}
