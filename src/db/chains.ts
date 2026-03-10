import { getDb } from "./client";
import type { Chain, ChainStatus } from "@/types/chain";

export async function getChain(chainId: string): Promise<Chain | undefined> {
  const db = await getDb();
  return db.get("chains", chainId);
}

export async function getAllChains(): Promise<Chain[]> {
  const db = await getDb();
  const chains = await db.getAll("chains");
  return chains.sort((a, b) => b.last_event_at - a.last_event_at);
}

export async function getChainsByStatus(status: ChainStatus): Promise<Chain[]> {
  const db = await getDb();
  return db.getAllFromIndex("chains", "by_status", status);
}

export async function getChainsByAccount(accountId: string): Promise<Chain[]> {
  const db = await getDb();
  return db.getAllFromIndex("chains", "by_account", accountId);
}

export async function upsertChain(chain: Chain): Promise<void> {
  const db = await getDb();
  await db.put("chains", chain);
}

export async function updateChainStatus(
  chainId: string,
  status: ChainStatus,
  confidence?: number
): Promise<void> {
  const db = await getDb();
  const chain = await db.get("chains", chainId);
  if (!chain) return;
  await db.put("chains", {
    ...chain,
    status,
    ...(confidence !== undefined ? { confidence } : {}),
  });
}

export async function deleteChain(chainId: string): Promise<void> {
  const db = await getDb();
  await db.delete("chains", chainId);
}

export async function clearAllChains(): Promise<void> {
  const db = await getDb();
  await db.clear("chains");
}
