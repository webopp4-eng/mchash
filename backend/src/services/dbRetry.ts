import { Prisma } from '@prisma/client';

/**
 * Transient database-connection retry helper.
 *
 * Supabase's PgBouncer pooler (used for DATABASE_URL) can intermittently
 * refuse/drop connections for a brief moment (Prisma codes P1001/P1002/P1017).
 * These are NOT application bugs — they are transient infra blips. This helper
 * retries a callback with backoff when such a transient error occurs, so a
 * single-second pool drop doesn't surface to the user as a hard failure.
 */

const RETRYABLE_PRISMA_CODES = ['P1001', 'P1002', 'P1017'];

export function isTransientDbError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_PRISMA_CODES.includes(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const message = String((error as any)?.message || '');
  return /can't reach database|database server.*running|timed out|connection.*(?:refused|closed|failed|reset)|ECONNRESET|EAI_AGAIN|ETIMEDOUT|pool.*timeout/i.test(
    message
  );
}

/**
 * Runs `fn`, retrying on transient DB connection errors with exponential
 * backoff. Non-transient errors propagate immediately.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  { retries = 4, baseDelayMs = 350 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt >= retries || !isTransientDbError(err)) {
        throw err;
      }
      const delay = baseDelayMs * 2 ** attempt + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}