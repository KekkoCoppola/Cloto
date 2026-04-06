// Utility for exponential backoff retries with error-type discrimination.

/**
 * Sentinel error class: only errors of this type trigger a retry.
 * Non-retryable errors (e.g. 4xx client errors) propagate immediately.
 */
export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Retries `fn` up to `retries` times with exponential backoff.
 * Only retries when `fn` throws a `RetryableError`.
 * Any other error propagates immediately (fail-fast for 4xx, etc.)
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
): Promise<T> => {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // H-1 fix: non-retriable errors (4xx, logic errors) propagate immediately.
      if (!(error instanceof RetryableError)) throw error;
      lastError = error;
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw lastError;
};
