import { logger } from "@/shared/logger";

/**
 * Get a valid access token using Chrome's built-in identity management.
 * Chrome handles caching, expiry, and refresh automatically.
 * Pass interactive=true to show a login prompt if needed.
 */
export async function getAccessToken(interactive = false): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        logger.warn("getAuthToken error:", chrome.runtime.lastError.message);
        resolve(null);
      } else {
        resolve(token ?? null);
      }
    });
  });
}

/**
 * Remove a token from Chrome's cache (call before re-prompting after a 401).
 */
export async function removeCachedToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, resolve);
  });
}

/**
 * Check if user is authenticated (Chrome has a cached token).
 */
export async function hasStoredAuth(): Promise<boolean> {
  const token = await getAccessToken(false);
  return token !== null;
}

/**
 * Clear tokens — removes from Chrome cache and revokes with Google.
 */
export async function clearTokens(): Promise<void> {
  const token = await getAccessToken(false);
  if (!token) return;

  // Remove from Chrome's cache
  await removeCachedToken(token);

  // Best-effort revocation with Google
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`).catch(
    () => {}
  );
}

// Kept for compatibility — no-op since Chrome manages tokens
export async function refreshAccessToken(): Promise<string | null> {
  return getAccessToken(false);
}
