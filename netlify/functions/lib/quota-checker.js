/**
 * Quota Checker
 * Enforces daily limits per user and pilot-wide budget caps
 */

const config = require('./config');
const { getUserDailyUsage, getPilotStats } = require('./storage');

/**
 * Check if user is within daily quota
 */
async function checkDailyQuota(userId, service, requestData) {
  if (!config.ENABLE_QUOTA_ENFORCEMENT) {
    return { allowed: true };
  }

  try {
    const usage = await getUserDailyUsage(userId);

    // Check based on service type
    if (service === 'translate' || service === 'translation') {
      return checkTranslationQuota(usage, requestData);
    } else if (service === 'speech-synthesis' || service === 'tts') {
      return checkTTSQuota(usage, requestData);
    } else if (service === 'speech-recognition' || service === 'stt') {
      return checkSTTQuota(usage, requestData);
    }

    // Unknown service - allow by default
    return { allowed: true };

  } catch (error) {
    console.error('Quota check error:', error);
    // On error, allow the request (fail open)
    return { allowed: true };
  }
}

/**
 * Check translation quota
 */
function checkTranslationQuota(usage, requestData) {
  const currentCount = usage.translations.count;
  const currentChars = usage.translations.characters;
  const requestChars = requestData.text?.length || 0;

  // Check request count limit
  if (currentCount >= config.MAX_TRANSLATIONS_PER_DAY) {
    return {
      allowed: false,
      message: `Daily translation limit reached (${config.MAX_TRANSLATIONS_PER_DAY} requests/day). Resets at midnight.`,
      usage,
      limit: config.MAX_TRANSLATIONS_PER_DAY,
      current: currentCount,
    };
  }

  // Check character limit
  if (currentChars + requestChars > config.MAX_TRANSLATION_CHARS_PER_DAY) {
    return {
      allowed: false,
      message: `Daily character limit reached (${config.MAX_TRANSLATION_CHARS_PER_DAY} chars/day). Resets at midnight.`,
      usage,
      limit: config.MAX_TRANSLATION_CHARS_PER_DAY,
      current: currentChars,
    };
  }

  // Check per-request limit
  if (requestChars > config.MAX_CHARS_PER_TRANSLATION) {
    return {
      allowed: false,
      message: `Text too long. Maximum ${config.MAX_CHARS_PER_TRANSLATION} characters per request.`,
    };
  }

  return {
    allowed: true,
    remaining: {
      requests: config.MAX_TRANSLATIONS_PER_DAY - currentCount,
      characters: config.MAX_TRANSLATION_CHARS_PER_DAY - currentChars,
    },
  };
}

/**
 * Check TTS quota
 */
function checkTTSQuota(usage, requestData) {
  const currentCount = usage.tts.count;
  const currentChars = usage.tts.characters;
  const requestChars = requestData.text?.length || 0;

  // Check request count limit
  if (currentCount >= config.MAX_TTS_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      message: `Daily text-to-speech limit reached (${config.MAX_TTS_REQUESTS_PER_DAY} requests/day). Resets at midnight.`,
      usage,
      limit: config.MAX_TTS_REQUESTS_PER_DAY,
      current: currentCount,
    };
  }

  // Check character limit
  if (currentChars + requestChars > config.MAX_TTS_CHARS_PER_DAY) {
    return {
      allowed: false,
      message: `Daily audio generation limit reached (${config.MAX_TTS_CHARS_PER_DAY} chars/day). Resets at midnight.`,
      usage,
      limit: config.MAX_TTS_CHARS_PER_DAY,
      current: currentChars,
    };
  }

  // Check per-request limit
  if (requestChars > config.MAX_CHARS_PER_TTS) {
    return {
      allowed: false,
      message: `Text too long. Maximum ${config.MAX_CHARS_PER_TTS} characters per audio request.`,
    };
  }

  return {
    allowed: true,
    remaining: {
      requests: config.MAX_TTS_REQUESTS_PER_DAY - currentCount,
      characters: config.MAX_TTS_CHARS_PER_DAY - currentChars,
    },
  };
}

/**
 * Check STT quota
 */
function checkSTTQuota(usage, requestData) {
  const currentCount = usage.stt.count;
  const currentMinutes = usage.stt.minutes;

  // Check request count limit
  if (currentCount >= config.MAX_STT_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      message: `Daily speech recognition limit reached (${config.MAX_STT_REQUESTS_PER_DAY} requests/day). Resets at midnight.`,
      usage,
      limit: config.MAX_STT_REQUESTS_PER_DAY,
      current: currentCount,
    };
  }

  // Check minutes limit
  if (currentMinutes >= config.MAX_STT_MINUTES_PER_DAY) {
    return {
      allowed: false,
      message: `Daily audio transcription limit reached (${config.MAX_STT_MINUTES_PER_DAY} minutes/day). Resets at midnight.`,
      usage,
      limit: config.MAX_STT_MINUTES_PER_DAY,
      current: currentMinutes,
    };
  }

  return {
    allowed: true,
    remaining: {
      requests: config.MAX_STT_REQUESTS_PER_DAY - currentCount,
      minutes: config.MAX_STT_MINUTES_PER_DAY - currentMinutes,
    },
  };
}

/**
 * Check pilot-wide budget
 */
async function checkPilotBudget() {
  if (!config.ENABLE_BUDGET_PROTECTION) {
    return { allowed: true };
  }

  try {
    const stats = await getPilotStats();
    const budgetPercent = (stats.totalCost / config.PILOT_TOTAL_BUDGET_USD) * 100;

    // Check if budget exceeded
    if (budgetPercent >= config.BUDGET_CRITICAL_THRESHOLD * 100) {
      console.error('🚨 PILOT BUDGET CRITICAL:', {
        cost: stats.totalCost,
        budget: config.PILOT_TOTAL_BUDGET_USD,
        percent: budgetPercent.toFixed(1),
      });

      return {
        allowed: false,
        message: config.ERROR_MESSAGES.BUDGET_EXCEEDED,
        budgetUsed: stats.totalCost,
        budgetTotal: config.PILOT_TOTAL_BUDGET_USD,
        budgetPercent: budgetPercent.toFixed(1),
      };
    }

    // Warn at 80% threshold
    if (budgetPercent >= config.BUDGET_WARNING_THRESHOLD * 100) {
      console.warn('⚠️ PILOT BUDGET WARNING:', {
        cost: stats.totalCost,
        budget: config.PILOT_TOTAL_BUDGET_USD,
        percent: budgetPercent.toFixed(1),
      });
    }

    return {
      allowed: true,
      budgetRemaining: config.PILOT_TOTAL_BUDGET_USD - stats.totalCost,
      budgetPercent: budgetPercent.toFixed(1),
    };

  } catch (error) {
    console.error('Budget check error:', error);
    // On error, allow the request (fail open)
    return { allowed: true };
  }
}

/**
 * Estimate cost for operation
 */
function estimateCost(service, data) {
  const characters = data.text?.length || 0;
  const minutes = data.minutes || 0;

  if (service === 'translate' || service === 'translation') {
    return (characters / 1000) * config.COST_PER_1K_CHARS_TRANSLATION;
  } else if (service === 'speech-synthesis' || service === 'tts') {
    const costPer1K = config.USE_NEURAL_VOICES
      ? config.COST_PER_1K_CHARS_TTS_NEURAL
      : config.COST_PER_1K_CHARS_TTS_STANDARD;
    return (characters / 1000) * costPer1K;
  } else if (service === 'speech-recognition' || service === 'stt') {
    return (minutes / 60) * config.COST_PER_HOUR_STT;
  }

  return 0;
}

module.exports = {
  checkDailyQuota,
  checkPilotBudget,
  estimateCost,
};
