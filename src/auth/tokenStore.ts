import {
  OAUTH_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GMAIL_SCOPES,
} from "@/shared/constants";
import { logger } from "@/shared/logger";

const ACCESS_TOKEN_KEY = "emailchain_access_token";
const TOKEN_EXPIRY_KEY = "emailchain_token_expiry";
const LOGIN_HINT_KEY = "emailchain_login_hint"; // persisted for silent refresh

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min early

/**
 * Get a valid access token.
 * - First checks chrome.storage.session for a cached non-expired token.
 * - If expired, attempts a silent refresh via launchWebAuthFlow (prompt=none).
 * - If interactive=true and silent refresh fails, throws so caller can re-prompt.
 */
export async function getAccessToken(interactive = false): Promise<string | null> {
  // 1. Check session cache
  const session = await chrome.storage.session.get([ACCESS_TOKEN_KEY, TOKEN_EXPIRY_KEY]);
  const token = session[ACCESS_TOKEN_KEY] as string | undefined;
  const expiry = session[TOKEN_EXPIRY_KEY] as number | undefined;

  if (token && expiry && Date.now() < expiry - EXPIRY_BUFFER_MS) {
    return token;
  }

  // 2. Try silent refresh using stored login_hint
  const local = await chrome.storage.local.get(LOGIN_HINT_KEY);
  const loginHint = local[LOGIN_HINT_KEY] as string | undefined;

  if (loginHint) {
    const silentToken = await launchImplicitFlow({
      loginHint,
      prompt: "none",
      interactive: false,
    });
    if (silentToken) return silentToken;
  }

  // 3. No valid token — caller must re-authenticate interactively
  if (!interactive) return null;
  return null; // signal to caller to trigger connectGmail()
}

/**
 * Launch the OAuth implicit flow via launchWebAuthFlow.
 * Returns the access_token string, or null on failure/cancellation.
 */
export async function launchImplicitFlow({
  loginHint,
  prompt,
  interactive,
}: {
  loginHint?: string;
  prompt: "select_account" | "none" | "consent";
  interactive: boolean;
}): Promise<string | null> {
  const redirectUri = chrome.identity.getRedirectURL();

  // Log so you can verify this matches Google Cloud Console exactly
  console.log("[JobFlow] redirect_uri:", JSON.stringify(redirectUri));
  console.log("[JobFlow] client_id:", GOOGLE_CLIENT_ID);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: GMAIL_SCOPES.join(" "),
    prompt,
  });
  if (loginHint) params.set("login_hint", loginHint);

  const authUrl = `${OAUTH_AUTH_URL}?${params}`;

  let redirectUrl: string | undefined;
  try {
    redirectUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive });
  } catch (err) {
    if (!interactive) return null; // silent fail expected
    logger.error("launchWebAuthFlow error:", err);
    return null;
  }

  if (!redirectUrl) return null;

  // Token comes back in the URL fragment: #access_token=...&expires_in=...
  const fragment = redirectUrl.includes("#")
    ? redirectUrl.split("#")[1]
    : redirectUrl.split("?")[1] ?? "";

  const fragmentParams = new URLSearchParams(fragment);
  const accessToken = fragmentParams.get("access_token");
  const expiresIn = parseInt(fragmentParams.get("expires_in") ?? "3599", 10);

  if (!accessToken) {
    logger.warn("No access_token in redirect:", redirectUrl);
    return null;
  }

  // Cache in session storage
  await chrome.storage.session.set({
    [ACCESS_TOKEN_KEY]: accessToken,
    [TOKEN_EXPIRY_KEY]: Date.now() + expiresIn * 1000,
  });

  return accessToken;
}

/**
 * Persist the login hint (email) so silent refresh can reuse it.
 */
export async function saveLoginHint(email: string): Promise<void> {
  await chrome.storage.local.set({ [LOGIN_HINT_KEY]: email });
}

/**
 * Clear all stored tokens and login hint.
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    chrome.storage.session.remove([ACCESS_TOKEN_KEY, TOKEN_EXPIRY_KEY]),
    chrome.storage.local.remove(LOGIN_HINT_KEY),
  ]);
}

/**
 * Revoke a token with Google (best-effort).
 */
export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`).catch(
    () => {}
  );
}

export async function hasStoredAuth(): Promise<boolean> {
  const local = await chrome.storage.local.get(LOGIN_HINT_KEY);
  return Boolean(local[LOGIN_HINT_KEY]);
}

// No-op kept for compatibility with gmail/client.ts
export async function removeCachedToken(_token: string): Promise<void> {
  await chrome.storage.session.remove([ACCESS_TOKEN_KEY, TOKEN_EXPIRY_KEY]);
}

export async function refreshAccessToken(): Promise<string | null> {
  return getAccessToken(false);
}
