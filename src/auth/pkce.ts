import { base64urlEncode } from "@/shared/utils";

/**
 * Generate a cryptographically random PKCE code verifier (43–128 chars, base64url).
 */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

/**
 * Generate a PKCE code challenge from a verifier using SHA-256.
 * Returns base64url(SHA-256(verifier)).
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(new Uint8Array(hashBuffer));
}
