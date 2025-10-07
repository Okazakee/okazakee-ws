import { cache } from 'react';

type RateLimitEntry = {
  count: number;
  timestamp: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Maximum 10 requests per minute
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes

// Cleanup function to prevent memory leaks
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.timestamp > RATE_LIMIT_DURATION) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => rateLimitStore.delete(key));
}

// Set up periodic cleanup (only in server environment)
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

export const checkRateLimit = cache((identifier: string): boolean => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now - entry.timestamp > RATE_LIMIT_DURATION) {
    rateLimitStore.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (entry.count >= MAX_REQUESTS) {
    return false;
  }

  entry.count += 1;
  return true;
});
