/**
 * Rate Limiter
 * Prevents abuse by limiting requests per user per minute
 */

const { getStore } = require('@netlify/blobs');
const config = require('./config');

let rateLimitStore;
try {
  rateLimitStore = getStore('rate-limits');
} catch (error) {
  console.warn('Netlify Blobs not configured for rate limiting:', error.message);
}

/**
 * Check if user is within rate limit
 */
async function checkRateLimit(userId) {
  if (!config.ENABLE_RATE_LIMITING) {
    return { allowed: true };
  }

  if (!rateLimitStore) {
    console.warn('Rate limit store not available, allowing request');
    return { allowed: true };
  }

  try {
    const now = Date.now();
    const windowStart = now - config.RATE_LIMIT_WINDOW_MS;
    const key = `${userId}:requests`;

    // Get recent requests
    const data = await rateLimitStore.get(key);
    let requests = data ? JSON.parse(data) : [];

    // Filter to only requests within the time window
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if over limit
    if (requests.length >= config.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...requests);
      const retryAfter = Math.ceil((oldestRequest + config.RATE_LIMIT_WINDOW_MS - now) / 1000);

      return {
        allowed: false,
        message: config.ERROR_MESSAGES.RATE_LIMIT,
        retryAfter,
        current: requests.length,
        limit: config.MAX_REQUESTS_PER_MINUTE,
      };
    }

    // Add current request
    requests.push(now);

    // Store with TTL
    await rateLimitStore.set(key, JSON.stringify(requests), {
      metadata: { ttl: config.RATE_LIMIT_TTL_SECONDS },
    });

    return {
      allowed: true,
      remaining: config.MAX_REQUESTS_PER_MINUTE - requests.length,
    };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return { allowed: true };
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
async function resetRateLimit(userId) {
  try {
    const key = `${userId}:requests`;
    await rateLimitStore.delete(key);
    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
}

module.exports = {
  checkRateLimit,
  resetRateLimit,
};
