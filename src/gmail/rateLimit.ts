import { logger } from "@/shared/logger";

/**
 * Exponential backoff retry wrapper.
 * Respects Retry-After header on 429 responses.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === maxAttempts - 1) break;

      // Check for rate limit errors
      const isRateLimit =
        lastError.message.includes("429") ||
        lastError.message.includes("rate") ||
        lastError.message.includes("quota");

      if (!isRateLimit && !lastError.message.includes("5")) {
        // Don't retry non-retriable errors
        throw lastError;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(`Retry ${attempt + 1}/${maxAttempts} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse Retry-After header and return delay in ms.
 */
export function parseRetryAfter(headers: Headers): number {
  const retryAfter = headers.get("Retry-After");
  if (!retryAfter) return 1000;

  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) return seconds * 1000;

  // Could be HTTP date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return 1000;
}
