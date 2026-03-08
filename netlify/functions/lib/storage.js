/**
 * Storage Wrapper for Netlify Blobs
 * Handles user quotas, usage logging, pilot statistics, and TTS audio cache
 */

const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');
const config = require('./config');

// Initialize blob stores with context
// Netlify automatically provides these in production
let usageStore, quotaStore, statsStore, audioStore;

try {
  usageStore = getStore('usage-logs');
  quotaStore = getStore('user-quotas');
  statsStore = getStore('pilot-stats');
  audioStore = getStore('tts-audio-cache');
} catch (error) {
  console.warn('Netlify Blobs not configured:', error.message);
  // Stores will be undefined, handled gracefully below
}

// TTS audio cache TTL: 30 days (audio doesn't change)
const AUDIO_CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;

/**
 * Generate a cache key for TTS audio
 */
function getAudioCacheKey(text, language, voice, rate) {
  const hash = crypto.createHash('sha256')
    .update(`${text}:${language}:${voice}:${rate}`)
    .digest('hex')
    .substring(0, 16);
  return `${language}:${hash}`;
}

/**
 * Get cached TTS audio if available
 */
async function getCachedAudio(text, language, voice, rate) {
  if (!audioStore) return null;
  try {
    const key = getAudioCacheKey(text, language, voice, rate);
    const data = await audioStore.get(key);
    if (data) {
      console.log(`🎵 Audio cache HIT: ${language}:${text.substring(0, 20)}...`);
    }
    return data || null;
  } catch (error) {
    console.warn('Audio cache get error:', error.message);
    return null;
  }
}

/**
 * Store TTS audio in cache
 */
async function setCachedAudio(text, language, voice, rate, audioBase64) {
  if (!audioStore) return;
  try {
    const key = getAudioCacheKey(text, language, voice, rate);
    await audioStore.set(key, audioBase64, {
      metadata: { ttl: AUDIO_CACHE_TTL_SECONDS },
    });
    console.log(`💾 Audio cached: ${language}:${text.substring(0, 20)}...`);
  } catch (error) {
    console.warn('Audio cache set error:', error.message);
    // Don't throw — caching failure shouldn't break TTS
  }
}

/**
 * Generate today's date key (YYYY-MM-DD)
 */
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate unique user identifier from request
 */
function getUserId(event) {
  // Try to get from headers (extension can send this)
  const headerUserId = event.headers['x-user-id'];
  if (headerUserId) {
    return headerUserId;
  }

  // Fall back to origin (chrome extension ID)
  const origin = event.headers.origin || event.headers.referer || '';
  const match = origin.match(/chrome-extension:\/\/([a-z]+)/);
  if (match) {
    return `ext_${match[1]}`;
  }

  // Last resort: use client IP (not ideal but better than nothing)
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  return `ip_${ip.split(',')[0].trim()}`;
}

/**
 * Get user's daily usage
 */
async function getUserDailyUsage(userId) {
  const today = getTodayKey();
  const key = `${userId}:${today}`;

  // Return empty usage if stores not available
  if (!quotaStore) {
    console.warn('Quota store not available, returning empty usage');
    return {
      date: today,
      translations: { count: 0, characters: 0 },
      tts: { count: 0, characters: 0 },
      stt: { count: 0, minutes: 0 },
      totalCost: 0,
    };
  }

  try {
    const data = await quotaStore.get(key);

    if (!data) {
      // Return empty usage
      return {
        date: today,
        translations: { count: 0, characters: 0 },
        tts: { count: 0, characters: 0 },
        stt: { count: 0, minutes: 0 },
        totalCost: 0,
      };
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching user quota:', error);
    return {
      date: today,
      translations: { count: 0, characters: 0 },
      tts: { count: 0, characters: 0 },
      stt: { count: 0, minutes: 0 },
      totalCost: 0,
    };
  }
}

/**
 * Update user's daily usage
 */
async function updateUserQuota(userId, usageData) {
  const today = getTodayKey();
  const key = `${userId}:${today}`;

  if (!quotaStore) {
    console.warn('Quota store not available, skipping quota update');
    return await getUserDailyUsage(userId);
  }

  try {
    // Get current usage
    let quota = await getUserDailyUsage(userId);

    // Update based on service type
    if (usageData.service === 'translate' || usageData.service === 'translation') {
      quota.translations.count += 1;
      quota.translations.characters += usageData.characters || 0;
    } else if (usageData.service === 'speech-synthesis' || usageData.service === 'tts') {
      quota.tts.count += 1;
      quota.tts.characters += usageData.characters || 0;
    } else if (usageData.service === 'speech-recognition' || usageData.service === 'stt') {
      quota.stt.count += 1;
      quota.stt.minutes += usageData.minutes || 0;
    }

    quota.totalCost += usageData.cost || 0;
    quota.date = today;

    // Store with TTL
    await quotaStore.set(key, JSON.stringify(quota), {
      metadata: { ttl: config.USER_QUOTA_TTL_SECONDS },
    });

    return quota;
  } catch (error) {
    console.error('Error updating user quota:', error);
    throw error;
  }
}

/**
 * Log a usage event
 */
async function logUsage(userId, usageData) {
  if (!config.ENABLE_USAGE_LOGGING) {
    return;
  }

  if (!usageStore || !quotaStore || !statsStore) {
    console.warn('Storage not available, skipping usage logging');
    return;
  }

  try {
    // Generate unique log ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const logId = `${userId}:${timestamp}:${randomId}`;

    // Build log entry
    const logEntry = {
      userId,
      timestamp: new Date().toISOString(),
      service: usageData.service,
      characters: usageData.characters || 0,
      minutes: usageData.minutes || 0,
      cost: usageData.cost || 0,
      sourceLanguage: usageData.sourceLanguage,
      targetLanguage: usageData.targetLanguage,
      success: usageData.success !== false,
      errorMessage: usageData.errorMessage,
    };

    // Store log
    await usageStore.set(logId, JSON.stringify(logEntry));

    // Update user quota
    await updateUserQuota(userId, usageData);

    // Update pilot stats
    await updatePilotStats(usageData);

  } catch (error) {
    console.error('Error logging usage:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

/**
 * Get pilot-wide statistics
 */
async function getPilotStats() {
  try {
    const data = await statsStore.get('total');

    if (!data) {
      return {
        totalCost: 0,
        totalRequests: 0,
        totalCharacters: 0,
        translationRequests: 0,
        ttsRequests: 0,
        sttRequests: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('Error fetching pilot stats:', error);
    return {
      totalCost: 0,
      totalRequests: 0,
      totalCharacters: 0,
      translationRequests: 0,
      ttsRequests: 0,
      sttRequests: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Update pilot-wide statistics
 */
async function updatePilotStats(usageData) {
  if (!config.ENABLE_USAGE_LOGGING) {
    return;
  }

  try {
    let stats = await getPilotStats();

    stats.totalCost += usageData.cost || 0;
    stats.totalRequests += 1;
    stats.totalCharacters += usageData.characters || 0;

    if (usageData.service === 'translate' || usageData.service === 'translation') {
      stats.translationRequests = (stats.translationRequests || 0) + 1;
    } else if (usageData.service === 'speech-synthesis' || usageData.service === 'tts') {
      stats.ttsRequests = (stats.ttsRequests || 0) + 1;
    } else if (usageData.service === 'speech-recognition' || usageData.service === 'stt') {
      stats.sttRequests = (stats.sttRequests || 0) + 1;
    }

    stats.lastUpdated = new Date().toISOString();

    await statsStore.set('total', JSON.stringify(stats));

    return stats;
  } catch (error) {
    console.error('Error updating pilot stats:', error);
    // Don't throw - stat updates shouldn't break the API
  }
}

/**
 * Get all usage logs (for admin dashboard)
 */
async function getAllUsageLogs(limit = 100) {
  try {
    const { blobs } = await usageStore.list({ limit });

    const results = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const data = await usageStore.get(blob.key);
          return data ? JSON.parse(data) : null;
        } catch (_e) {
          return null;
        }
      })
    );
    const logs = results.filter(Boolean);

    // Sort by timestamp (newest first)
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error fetching usage logs:', error);
    return [];
  }
}

/**
 * Get usage breakdown by user
 */
async function getUserBreakdown() {
  try {
    const { blobs } = await quotaStore.list({ limit: 1000 });

    const userMap = {};

    await Promise.all(
      blobs.map(async (blob) => {
        let quota;
        try {
          const data = await quotaStore.get(blob.key);
          quota = data ? JSON.parse(data) : null;
        } catch (_e) {
          quota = null;
        }
        if (!quota) return;
        const userId = blob.key.split(':')[0];

        if (!userMap[userId]) {
          userMap[userId] = {
            translations: 0,
            tts: 0,
            stt: 0,
            totalCost: 0,
            totalCharacters: 0,
          };
        }

        userMap[userId].translations += quota.translations.count;
        userMap[userId].tts += quota.tts.count;
        userMap[userId].stt += quota.stt.count;
        userMap[userId].totalCost += quota.totalCost;
        userMap[userId].totalCharacters += quota.translations.characters + quota.tts.characters;
      })
    );

    return userMap;
  } catch (error) {
    console.error('Error fetching user breakdown:', error);
    return {};
  }
}

module.exports = {
  getUserId,
  getUserDailyUsage,
  updateUserQuota,
  logUsage,
  getPilotStats,
  updatePilotStats,
  getAllUsageLogs,
  getUserBreakdown,
  getCachedAudio,
  setCachedAudio,
};
