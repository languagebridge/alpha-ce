/**
 * GET USER USAGE FUNCTION
 *
 * Purpose: Returns current usage stats for a specific user
 * Allows extension to display remaining quota to users
 */

const config = require('./lib/config');
const { getUserId, getUserDailyUsage } = require('./lib/storage');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-ID',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

/**
 * Main handler function
 */
exports.handler = async (event, context) => {
  // Handle preflight CORS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use GET.' }),
    };
  }

  try {
    // Get user identifier
    const userId = getUserId(event);

    // Get user's daily usage
    const usage = await getUserDailyUsage(userId);

    // Calculate remaining quotas
    const translationsRemaining = Math.max(0, config.MAX_TRANSLATIONS_PER_DAY - usage.translations.count);
    const ttsRemaining = Math.max(0, config.MAX_TTS_REQUESTS_PER_DAY - usage.tts.count);

    const translationCharsRemaining = Math.max(0, config.MAX_TRANSLATION_CHARS_PER_DAY - usage.translations.characters);
    const ttsCharsRemaining = Math.max(0, config.MAX_TTS_CHARS_PER_DAY - usage.tts.characters);

    // Return usage info
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
      },
      body: JSON.stringify({
        userId,
        date: usage.date,

        translations: {
          used: usage.translations.count,
          limit: config.MAX_TRANSLATIONS_PER_DAY,
          remaining: translationsRemaining,
          percentUsed: ((usage.translations.count / config.MAX_TRANSLATIONS_PER_DAY) * 100).toFixed(1),
        },

        tts: {
          used: usage.tts.count,
          limit: config.MAX_TTS_REQUESTS_PER_DAY,
          remaining: ttsRemaining,
          percentUsed: ((usage.tts.count / config.MAX_TTS_REQUESTS_PER_DAY) * 100).toFixed(1),
        },

        characters: {
          translation: {
            used: usage.translations.characters,
            limit: config.MAX_TRANSLATION_CHARS_PER_DAY,
            remaining: translationCharsRemaining,
          },
          tts: {
            used: usage.tts.characters,
            limit: config.MAX_TTS_CHARS_PER_DAY,
            remaining: ttsCharsRemaining,
          },
        },

        cost: {
          total: usage.totalCost.toFixed(4),
        },

        resetsAt: getNextMidnight(),
      }),
    };

  } catch (error) {
    console.error('Get usage error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch usage',
        message: error.message,
      }),
    };
  }
};

/**
 * Get next midnight timestamp (UTC)
 */
function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
