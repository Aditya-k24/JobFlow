import {
  launchImplicitFlow,
  saveLoginHint,
  clearTokens,
  revokeToken,
  getAccessToken,
} from "./tokenStore";
import { saveAccount, deleteAccount, getFirstAccount } from "@/db/accounts";
import { GMAIL_SCOPES } from "@/shared/constants";
import { logger } from "@/shared/logger";

/**
 * Connect Gmail — always shows the Google account picker so the user
 * can choose which account to connect, regardless of what was previously connected.
 */
export async function connectGmail(): Promise<{ email: string; accountId: string }> {
  // Clear any previously cached token so the picker is never skipped
  await clearTokens();

  // Launch OAuth with prompt=select_account — forces Google to show the picker
  const token = await launchImplicitFlow({
    prompt: "select_account",
    interactive: true,
  });

  if (!token) {
    throw new Error("Sign-in was cancelled or failed.");
  }

  // Fetch the chosen account's email
  const userEmail = await fetchUserEmail(token);

  // Persist login_hint for future silent token refreshes
  await saveLoginHint(userEmail);

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
 * Disconnect Gmail: revoke the current token, clear storage, remove account.
 */
export async function disconnectGmail(): Promise<void> {
  // Revoke current access token if we have one
  const token = await getAccessToken(false);
  if (token) await revokeToken(token);

  await clearTokens();

  const account = await getFirstAccount();
  if (account) await deleteAccount(account.account_id);

  logger.log("Gmail disconnected");
}
