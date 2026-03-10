import { getAccessToken, clearTokens } from "./tokenStore";
import { saveAccount, deleteAccount, getFirstAccount } from "@/db/accounts";
import { GMAIL_SCOPES } from "@/shared/constants";
import { logger } from "@/shared/logger";

/**
 * Connect Gmail using Chrome's built-in identity API.
 * chrome.identity.getAuthToken handles the OAuth flow, token caching,
 * and refresh automatically — no PKCE or client secret needed.
 *
 * Must be called from a user gesture context (popup or options page).
 */
export async function connectGmail(): Promise<{ email: string; accountId: string }> {
  // Request an access token interactively (shows Google sign-in popup)
  const token = await getAccessToken(true);
  if (!token) {
    throw new Error("Sign-in was cancelled or failed.");
  }

  // Fetch the user's email address
  const userEmail = await fetchUserEmail(token);

  // Save account connection to IndexedDB
  const accountId = crypto.randomUUID();
  await saveAccount({
    account_id: accountId,
    provider_type: "gmail",
    provider_user_key: userEmail,
    email: userEmail,
    scopes_granted: GMAIL_SCOPES,
    connected_at: Date.now(),
    last_sync_at: null,
    last_history_id: null,
  });

  logger.log("Gmail connected:", userEmail);
  return { email: userEmail, accountId };
}

async function fetchUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/userinfo/v2/me?fields=email",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error("Failed to fetch user profile");
  const data = await response.json();
  return data.email as string;
}

/**
 * Disconnect Gmail: revoke token and remove account from IDB.
 */
export async function disconnectGmail(): Promise<void> {
  await clearTokens();

  const account = await getFirstAccount();
  if (account) await deleteAccount(account.account_id);

  logger.log("Gmail disconnected");
}
