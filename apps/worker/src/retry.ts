export type ErrorType = "transient" | "permanent";

const TRANSIENT_PATTERNS = [
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /rate.?limit/i,
  /too many requests/i,
  /429/,
  /503/,
  /502/,
  /network/i,
  /timeout/i,
  /socket hang up/i,
  /No image data/i,
  /Empty response from/i,
  /Unique constraint/i,
];

export function classifyError(error: unknown): ErrorType {
  const message = error instanceof Error ? error.message : String(error);

  if (TRANSIENT_PATTERNS.some((p) => p.test(message))) {
    return "transient";
  }

  return "permanent";
}

export function calculateBackoff(
  attempt: number,
  baseMs: number = 15_000,
  maxMs: number = 300_000,
): number {
  // attempt 1 → ~15s, attempt 2 → ~30s, attempt 3 → ~60s, attempt 4 → ~120s, attempt 5 → ~240s
  const backoff = Math.min(baseMs * Math.pow(2, attempt - 1), maxMs);
  // Add jitter (±25%) to prevent thundering herd
  const jitter = backoff * 0.25 * (Math.random() * 2 - 1);
  return Math.round(backoff + jitter);
}

export function shouldRetry(
  attempt: number,
  maxAttempts: number,
  errorType: ErrorType,
): boolean {
  if (errorType === "permanent") return false;
  return attempt < maxAttempts;
}
