import { withRetry, RetryableError } from '../utils/retry';
import type { GeminiResponse } from '../types';

/**
 * Client-side chat service.
 * Communicates with the Express backend via REST — no SDK or API key on the client.
 *
 * Retry policy (H-1 fix):
 *   - 429 (rate limited) and 5xx (server errors) → RetryableError → withRetry retries
 *   - 4xx client errors (400, 404, etc.)         → Error → fail fast, no retry
 */
export class ChatService {
  /**
   * Creates a new server-side chat session and retrieves the initial greeting.
   * Returns the sessionId (opaque token) and the first AI response.
   */
  async createSession(): Promise<{ sessionId: string; data: GeminiResponse }> {
    const response = await withRetry(async () => {
      const res = await fetch('/api/chat/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      // Only 429 (rate limited) and 5xx (transient server errors) merit a retry.
      if (res.status === 429 || res.status >= 500) {
        throw new RetryableError(`Retriable error ${res.status} on /api/chat/create`, res.status);
      }
      if (!res.ok) {
        throw new Error(`Non-retriable error ${res.status} on /api/chat/create`);
      }
      return res;
    });
    return response.json();
  }

  /**
   * Sends a user message to an existing session.
   * @param sessionId - Opaque token returned by createSession()
   * @param message   - Raw user text (sanitization happens server-side)
   */
  async sendMessage(sessionId: string, message: string): Promise<GeminiResponse> {
    const response = await withRetry(async () => {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });
      // Only 429 (rate limited) and 5xx (transient server errors) merit a retry.
      if (res.status === 429 || res.status >= 500) {
        throw new RetryableError(`Retriable error ${res.status} on /api/chat/message`, res.status);
      }
      if (!res.ok) {
        throw new Error(`Non-retriable error ${res.status} on /api/chat/message`);
      }
      return res;
    });
    return response.json();
  }
}
