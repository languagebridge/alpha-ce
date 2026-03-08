/**
 * LanguageBridge API Protection Configuration
 * Pilot Program Settings - 50 students, 8 weeks
 */

module.exports = {
  // ============================================================================
  // DAILY QUOTAS (Per User)
  // ============================================================================

  // Translation limits
  MAX_TRANSLATIONS_PER_DAY: 100,
  MAX_TRANSLATION_CHARS_PER_DAY: 50000, // ~20 pages of text

  // Text-to-Speech limits
  MAX_TTS_REQUESTS_PER_DAY: 50,
  MAX_TTS_CHARS_PER_DAY: 25000, // ~10 pages of audio

  // Speech-to-Text limits (if used)
  MAX_STT_REQUESTS_PER_DAY: 30,
  MAX_STT_MINUTES_PER_DAY: 15, // 15 minutes of audio

  // ============================================================================
  // RATE LIMITS (Per User Per Minute)
  // ============================================================================

  MAX_REQUESTS_PER_MINUTE: 10, // Prevents rapid-fire abuse
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute window

  // ============================================================================
  // PER-REQUEST LIMITS
  // ============================================================================

  MAX_CHARS_PER_TRANSLATION: 5000, // Single request character limit
  MAX_CHARS_PER_TTS: 3000, // Single TTS request limit
  MAX_AUDIO_DURATION_SECONDS: 300, // 5 minutes max audio

  // ============================================================================
  // PILOT BUDGET PROTECTION
  // ============================================================================

  // Total budget for entire pilot program
  PILOT_TOTAL_BUDGET_USD: parseFloat(process.env.PILOT_BUDGET_CAP || '150'),

  // Alert thresholds
  BUDGET_WARNING_THRESHOLD: 0.80, // Alert at 80%
  BUDGET_CRITICAL_THRESHOLD: 0.95, // Stop at 95%

  // ============================================================================
  // COST ESTIMATES (Azure pricing as of 2025)
  // ============================================================================

  // Azure Translator costs
  COST_PER_1K_CHARS_TRANSLATION: 0.010, // $10 per 1M characters

  // Azure Speech TTS costs (varies by voice type)
  COST_PER_1K_CHARS_TTS_NEURAL: 0.016, // Neural voices: $16 per 1M
  COST_PER_1K_CHARS_TTS_STANDARD: 0.004, // Standard voices: $4 per 1M

  // Azure Speech STT costs
  COST_PER_HOUR_STT: 1.00, // $1 per hour

  // Use neural voices by default (better quality)
  USE_NEURAL_VOICES: true,

  // ============================================================================
  // STORAGE & CACHING
  // ============================================================================

  // Netlify Blobs TTL settings
  USER_QUOTA_TTL_SECONDS: 172800, // 48 hours (auto-cleanup old data)
  RATE_LIMIT_TTL_SECONDS: 120, // 2 minutes
  USAGE_LOG_TTL_DAYS: 90, // Keep logs for 90 days

  // Cache settings
  ENABLE_RESPONSE_CACHING: true,
  CACHE_TTL_SECONDS: 300, // 5 minutes for config endpoint

  // ============================================================================
  // ADMIN & SECURITY
  // ============================================================================

  // Admin API key for dashboard access
  ADMIN_API_KEY: process.env.ADMIN_API_KEY,

  // Allowed origins (Chrome extension)
  ALLOWED_ORIGINS: [
    /^chrome-extension:\/\//,
    /^https:\/\/languagebridge\.app$/,
    /^https:\/\/.*\.netlify\.app$/,
  ],

  // Enable/disable features
  ENABLE_USAGE_LOGGING: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_QUOTA_ENFORCEMENT: true,
  ENABLE_BUDGET_PROTECTION: true,

  // ============================================================================
  // AZURE API CONFIGURATION
  // ============================================================================

  AZURE_TRANSLATOR_KEY: process.env.AZURE_TRANSLATOR_KEY,
  AZURE_TRANSLATOR_ENDPOINT: 'https://api.cognitive.microsofttranslator.com',
  AZURE_TRANSLATOR_REGION: process.env.AZURE_TRANSLATOR_REGION || process.env.AZURE_REGION || 'eastus',

  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY,
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION || process.env.AZURE_REGION || 'eastus',

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // Retry settings
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,

  // Error messages
  ERROR_MESSAGES: {
    RATE_LIMIT: 'Rate limit exceeded. Please wait a moment and try again.',
    DAILY_QUOTA: 'Daily usage limit reached. Your quota resets at midnight.',
    BUDGET_EXCEEDED: 'Pilot program budget has been reached. Please contact your teacher.',
    INVALID_REQUEST: 'Invalid request. Please check your input and try again.',
    SERVER_ERROR: 'Service temporarily unavailable. Please try again later.',
  },

  // ============================================================================
  // MONITORING & ALERTS
  // ============================================================================

  // Alert email (if you want to add email notifications)
  ALERT_EMAIL: process.env.ALERT_EMAIL || 'info@languagebridge.app',

  // Enable console logging
  ENABLE_DEBUG_LOGGING: process.env.CONTEXT !== 'production',
};
