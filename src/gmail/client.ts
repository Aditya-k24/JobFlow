import { GMAIL_BASE_URL } from "@/shared/constants";
import { getAccessToken, removeCachedToken } from "@/auth/tokenStore";
import { withRetry } from "./rateLimit";
import type {
  GmailListResponse,
  GmailMessage,
  GmailHistoryResponse,
  GmailUserProfile,
} from "@/types/gmail";
import { logger } from "@/shared/logger";

async function gmailFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  return withRetry(async () => {
    let token = await getAccessToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    let response = await fetch(`${GMAIL_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle token expiry — remove stale token and get a fresh one
    if (response.status === 401) {
      logger.warn("Access token expired, refreshing...");
      await removeCachedToken(token);
      token = await getAccessToken(false);
      if (!token) throw new Error("Authentication expired");

      response = await fetch(`${GMAIL_BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") ?? "1";
      throw new Error(`429 Too Many Requests. Retry-After: ${retryAfter}`);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Gmail API error ${response.status}: ${body}`);
    }

    return response.json() as Promise<T>;
  });
}

export async function getUserProfile(userId = "me"): Promise<GmailUserProfile> {
  return gmailFetch<GmailUserProfile>(`/users/${userId}/profile`);
}

export async function listMessages(
  userId = "me",
  params: {
    q?: string;
    pageToken?: string;
    maxResults?: number;
    labelIds?: string[];
  } = {}
): Promise<GmailListResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.pageToken) query.set("pageToken", params.pageToken);
  if (params.maxResults) query.set("maxResults", String(params.maxResults));
  if (params.labelIds) {
    params.labelIds.forEach((l) => query.append("labelIds", l));
  }
  return gmailFetch<GmailListResponse>(
    `/users/${userId}/messages?${query}`
  );
}

export async function getMessage(
  messageId: string,
  userId = "me",
  format: "full" | "metadata" | "minimal" = "full"
): Promise<GmailMessage> {
  return gmailFetch<GmailMessage>(
    `/users/${userId}/messages/${messageId}?format=${format}`
  );
}

export async function listHistory(
  userId = "me",
  params: {
    startHistoryId: string;
    pageToken?: string;
    maxResults?: number;
    historyTypes?: string[];
  }
): Promise<GmailHistoryResponse> {
  const query = new URLSearchParams({
    startHistoryId: params.startHistoryId,
    maxResults: String(params.maxResults ?? 100),
  });
  if (params.pageToken) query.set("pageToken", params.pageToken);
  if (params.historyTypes) {
    params.historyTypes.forEach((t) => query.append("historyTypes", t));
  }
  return gmailFetch<GmailHistoryResponse>(
    `/users/${userId}/history?${query}`
  );
}
