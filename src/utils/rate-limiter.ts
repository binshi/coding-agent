/**
 * Rate Limiter for API requests and token usage
 * Implements a token bucket algorithm with sliding window.
 */

export interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
  maxConcurrent: number;
}

export const DEFAULT_RATE_LIMITS: RateLimiterConfig = {
  maxRequestsPerMinute: 50,
  maxTokensPerMinute: 100000,
  maxConcurrent: 5
};

interface RequestRecord {
  timestamp: number;
  tokens: number;
}

/**
 * Token bucket rate limiter with sliding window
 */
export class RateLimiter {
  private config: RateLimiterConfig;
  private requestHistory: RequestRecord[] = [];
  private activeRequests: number = 0;
  private waitQueue: Array<() => void> = [];

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMITS, ...config };
  }

  /**
   * Main entry point — wait until a request can proceed within rate limits
   */
  async acquire(estimatedTokens: number = 1000): Promise<void> {
    await this.waitForSlot();
    await this.waitForRateLimit(estimatedTokens);
    this.activeRequests++;
    this.requestHistory.push({ timestamp: Date.now(), tokens: estimatedTokens });
  }

  /**
   * Release a request slot after completion
   */
  release(actualTokens?: number): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);

    if (actualTokens !== undefined && this.requestHistory.length > 0) {
      const lastRequest = this.requestHistory[this.requestHistory.length - 1];
      if (lastRequest) {
        lastRequest.tokens = actualTokens;
      }
    }

    const next = this.waitQueue.shift();
    if (next) next();
  }

  /**
   * Get current rate limit status
   */
  getStatus() {
    this.pruneOldRecords();
    const requestsInWindow = this.requestHistory.length;
    const tokensInWindow = this.requestHistory.reduce((sum, r) => sum + r.tokens, 0);

    return {
      activeRequests: this.activeRequests,
      requestsInWindow,
      tokensInWindow,
      availableRequests: Math.max(0, this.config.maxRequestsPerMinute - requestsInWindow),
      availableTokens: Math.max(0, this.config.maxTokensPerMinute - tokensInWindow)
    };
  }

  /**
   * Check if a request can proceed immediately
   */
  canProceed(estimatedTokens: number = 1000): boolean {
    this.pruneOldRecords();
    const requestsInWindow = this.requestHistory.length;
    const tokensInWindow = this.requestHistory.reduce((sum, r) => sum + r.tokens, 0);

    return (
      this.activeRequests < this.config.maxConcurrent &&
      requestsInWindow < this.config.maxRequestsPerMinute &&
      tokensInWindow + estimatedTokens <= this.config.maxTokensPerMinute
    );
  }

  /**
   * Wait for a concurrent request slot to become available
   */
  private async waitForSlot(): Promise<void> {
    if (this.activeRequests < this.config.maxConcurrent) return;
    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Wait until rate limits allow the request to proceed (sliding window)
   */
  private async waitForRateLimit(estimatedTokens: number): Promise<void> {
    while (!this.canProceed(estimatedTokens)) {
      this.pruneOldRecords();
      if (this.requestHistory.length === 0) break;

      const oldest = this.requestHistory[0];
      if (!oldest) break;

      const expiresAt = oldest.timestamp + 60000;
      const waitTime = Math.min(Math.max(100, expiresAt - Date.now() + 100), 5000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Remove request records older than 60 seconds
   */
  private pruneOldRecords(): void {
    const cutoff = Date.now() - 60000;
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
  }
}


/**
 * Wrap an async function with rate limiting
 */
export function withRateLimit<T>(
  rateLimiter: RateLimiter,
  fn: () => Promise<T>,
  estimatedTokens: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      await rateLimiter.acquire(estimatedTokens);
      const result = await fn();
      rateLimiter.release();
      resolve(result);
    } catch (error) {
      rateLimiter.release();
      reject(error);
    }
  });
}

/** Global rate limiter instance */
export const globalRateLimiter = new RateLimiter();
