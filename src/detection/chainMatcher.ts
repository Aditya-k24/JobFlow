import { getAllChains, upsertChain } from "@/db/chains";
import type { Chain, ChainStatus } from "@/types/chain";
import { STATUS_ORDER } from "@/types/chain";
import { normalizeDomain, domainToCompanyName, levenshtein } from "@/shared/utils";
import { logger } from "@/shared/logger";

/**
 * Find an existing chain or create a new one for the given detection.
 * Returns the chain_id.
 */
export async function findOrCreateChain(params: {
  accountId: string;
  fromDomain: string;
  companyRaw?: string;
  roleRaw?: string;
  newStatus: ChainStatus;
  eventTime: number;
  confidence: number;
}): Promise<string> {
  const { accountId, fromDomain, companyRaw, roleRaw, newStatus, eventTime, confidence } = params;

  const canonicalCompany = normalizeCompanyName(companyRaw ?? domainToCompanyName(normalizeDomain(fromDomain)));
  const canonicalRole = normalizeRoleTitle(roleRaw ?? "");

  // Find existing chains for this account
  const existingChains = await getAllChains();
  const accountChains = existingChains.filter((c) => c.account_id === accountId);

  // Try to find a matching chain
  const match = findBestMatch(accountChains, canonicalCompany, canonicalRole);

  if (match) {
    // Update existing chain: status (only advance), last_event_at, confidence
    const updatedStatus = advanceStatus(match.status, newStatus);
    await upsertChain({
      ...match,
      status: updatedStatus,
      last_event_at: Math.max(match.last_event_at, eventTime),
      confidence: Math.max(match.confidence, confidence),
      // Update role/company if we have better info
      ...(canonicalRole && !match.role_title ? { role_title: canonicalRole } : {}),
    });
    logger.log(`Matched existing chain: ${match.canonical_company} / ${match.role_title}`);
    return match.chain_id;
  }

  // Create new chain
  const newChain: Chain = {
    chain_id: crypto.randomUUID(),
    canonical_company: canonicalCompany,
    role_title: canonicalRole,
    status: newStatus,
    last_event_at: eventTime,
    confidence,
    created_at: Date.now(),
    account_id: accountId,
  };

  await upsertChain(newChain);
  logger.log(`Created new chain: ${canonicalCompany} / ${canonicalRole}`);
  return newChain.chain_id;
}

function findBestMatch(
  chains: Chain[],
  company: string,
  role: string
): Chain | null {
  if (!company) return null;

  const companyNorm = company.toLowerCase();
  const roleNorm = role.toLowerCase();

  for (const chain of chains) {
    const chainCompany = chain.canonical_company.toLowerCase();
    const chainRole = chain.role_title.toLowerCase();

    // Company must match (either exact or very similar)
    const companyDist = levenshtein(companyNorm, chainCompany);
    const companyThreshold = Math.max(2, Math.floor(companyNorm.length * 0.2));

    if (companyDist > companyThreshold) continue;

    // If role is provided, it should also match
    if (role && chainRole) {
      const roleDist = levenshtein(roleNorm, chainRole);
      const roleThreshold = Math.max(3, Math.floor(roleNorm.length * 0.3));
      if (roleDist > roleThreshold) continue;
    }

    return chain;
  }

  return null;
}

/**
 * Only advance status forward, never downgrade.
 * E.g., if a chain is INTERVIEWING and we detect APPLICATION_RECEIVED again, keep INTERVIEWING.
 */
function advanceStatus(current: ChainStatus, next: ChainStatus): ChainStatus {
  // REJECTED and WITHDRAWN are terminal — always keep them
  if (current === "REJECTED" || current === "WITHDRAWN") return current;

  const currentIdx = STATUS_ORDER.indexOf(current);
  const nextIdx = STATUS_ORDER.indexOf(next);

  return nextIdx > currentIdx ? next : current;
}

/**
 * Map event type to chain status.
 */
export function eventTypeToStatus(eventType: string): ChainStatus {
  const map: Record<string, ChainStatus> = {
    APPLICATION_RECEIVED: "APPLIED",
    FOLLOW_UP: "APPLIED",
    ASSESSMENT_INVITE: "ASSESSMENT",
    INTERVIEW_INVITE: "INTERVIEWING",
    OFFER: "OFFER",
    REJECTION: "REJECTED",
    DEADLINE: "APPLIED", // Doesn't change status on its own
    OTHER: "APPLIED",
  };
  return map[eventType] ?? "APPLIED";
}

function normalizeCompanyName(name: string): string {
  return name
    .replace(/\b(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?)\b/gi, "")
    .replace(/[.,]$/g, "")
    .trim();
}

function normalizeRoleTitle(role: string): string {
  return role
    .replace(/\b(senior|sr\.?|junior|jr\.?|lead|principal|staff)\b/gi, (m) => m.trim())
    .replace(/\s+/g, " ")
    .trim();
}
