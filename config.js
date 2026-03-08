/**
 * LanguageBridge - Configuration (Alpha Version - No Analytics)
 * Central configuration for the extension
 *
 * ALPHA PILOT NOTE:
 * - Analytics and classroom linking removed for alpha testing
 * - Focus on core translation/glossary features
 * - Azure API is the only external service
 * - Manual feedback collection from teachers/students
 */

// ============================================================================
// CONFIGURATION LOADER - Fetches secure config from Netlify
// ============================================================================

/**
 * Global configuration object (will be populated from server)
 */
window.CONFIG = {
  // Default Netlify URL (will be overridden by server response)
  netlifyBaseUrl: 'https://exquisite-croissant-4288dd.netlify.app',

  // Loading state
  _isLoaded: false,
  _isLoading: false,
  _loadPromise: null,

  // Azure endpoints only (no analytics/Supabase for alpha)
  endpoints: {
    azureProxy: null,
    getSpeechKey: null,
    getClientConfig: null, // Will be set below
  },

  website: {
    base: 'https://languagebridge.app',
    privacyPolicy: 'https://languagebridge.app/privacy',
    support: 'https://languagebridge.app/support',
    dashboard: 'https://languagebridge.app/dashboard',
  },

  support: {
    email: 'info@languagebridge.app',
    phone: '216-800-6020',
    accountManager: 'P. Howard, CTO'
  },

  // Feature Flags (can be overridden by server)
  features: {
    offlineVocabularyEnabled: true,
    translationCachingEnabled: true,
    maxCacheSize: 100,
  },

  // Alpha pilot deployment type
  deploymentType: 'alpha-pilot',

  // Text Length Limits
  textLimits: {
    maxSelectionLength: 2000,
    maxGlossaryTerms: 50,
    selectionWarningThreshold: 1500,
  },

  // Rate Limiting
  rateLimits: {
    translationsPerMinute: 30,
    ttsRequestsPerMinute: 20,
    speechRecognitionPerMinute: 15,
    cooldownPeriod: 60000, // 1 minute
  },

  // Cache TTL
  cache: {
    translationTTL: 24 * 60 * 60 * 1000, // 24 hours
    speechKeyTTL: 60 * 60 * 1000,        // 1 hour
    configTTL: 5 * 60 * 1000,            // 5 minutes (matches server cache)
  },

  // Privacy & Compliance (Alpha - No Data Collection)
  privacy: {
    analyticsEnabled: false, // Disabled for alpha pilot
    noDataCollection: true,  // Only Azure API calls for translation/TTS
  },

  // Version Info
  version: '1.0.6',
  environment: 'production',
};

// Set the config endpoint
window.CONFIG.endpoints.getClientConfig = `${window.CONFIG.netlifyBaseUrl}/.netlify/functions/get-client-config`;

// ============================================================================
// CONFIGURATION LOADER FUNCTION
// ============================================================================

/**
 * Load secure configuration from Netlify
 * This function is called automatically when the extension loads
 * Returns a Promise that resolves when config is loaded
 */
window.loadSecureConfig = async function() {
  // If already loaded, return immediately
  if (window.CONFIG._isLoaded) {
    return Promise.resolve(window.CONFIG);
  }

  // If currently loading, return the existing promise
  if (window.CONFIG._isLoading) {
    return window.CONFIG._loadPromise;
  }

  // Start loading
  window.CONFIG._isLoading = true;

  window.CONFIG._loadPromise = (async () => {
    try {
      if (window.logger) {
        window.logger.log('🔐 Loading secure configuration from Netlify...');
      }

      const response = await fetch(window.CONFIG.endpoints.getClientConfig, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Config server returned ${response.status}`);
      }

      const serverConfig = await response.json();

      // Merge server config into window.CONFIG (no Supabase for alpha)
      Object.assign(window.CONFIG.endpoints, serverConfig.endpoints);
      Object.assign(window.CONFIG.website, serverConfig.website);
      Object.assign(window.CONFIG.support, serverConfig.support);

      // Merge optional configs (keep local values if server doesn't provide)
      if (serverConfig.features) {
        Object.assign(window.CONFIG.features, serverConfig.features);
      }
      if (serverConfig.rateLimits) {
        Object.assign(window.CONFIG.rateLimits, serverConfig.rateLimits);
      }
      if (serverConfig.textLimits) {
        Object.assign(window.CONFIG.textLimits, serverConfig.textLimits);
      }

      // Update metadata
      window.CONFIG.version = serverConfig.version || window.CONFIG.version;
      window.CONFIG.environment = serverConfig.environment || window.CONFIG.environment;

      window.CONFIG._isLoaded = true;
      window.CONFIG._isLoading = false;

      if (window.logger) {
        window.logger.log('✅ Configuration loaded successfully (Alpha - No Analytics)');
        window.logger.log('🌐 Environment:', window.CONFIG.environment);
      }

      return window.CONFIG;

    } catch (error) {
      window.CONFIG._isLoading = false;

      if (window.logger) {
        window.logger.error('❌ Failed to load secure configuration:', error);
        window.logger.warn('⚠️ Extension will operate with limited functionality');
      }

      // Show user-friendly error
      console.error(
        'LanguageBridge: Unable to connect to configuration server.\n' +
        'Translation features may be unavailable.\n' +
        'Please check your internet connection and reload the page.'
      );

      // Throw error so callers know config failed to load
      throw new Error('Configuration unavailable: ' + error.message);
    }
  })();

  return window.CONFIG._loadPromise;
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate configuration after loading
 * Checks that all required values are present
 */
window.validateConfig = function() {
  const errors = [];

  // Check Azure endpoints only (no Supabase for alpha)
  if (!window.CONFIG.endpoints.azureProxy) {
    errors.push('Missing Azure proxy endpoint');
  }
  // Note: getSpeechKey no longer used - STT goes through azure-proxy

  // Validate URLs
  const urlFields = [
    window.CONFIG.endpoints.azureProxy,
    window.CONFIG.website.base,
  ];

  urlFields.forEach((url, index) => {
    if (url) {
      try {
        new URL(url);
      } catch (e) {
        errors.push(`Invalid URL at index ${index}: ${url}`);
      }
    }
  });

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(window.CONFIG.support.email)) {
    errors.push(`Invalid support email: ${window.CONFIG.support.email}`);
  }

  if (errors.length > 0) {
    console.warn('⚠️ Configuration validation warnings:');
    errors.forEach(err => console.warn(`  - ${err}`));
    return false;
  }

  if (window.logger) {
    window.logger.log('✅ Configuration validation passed');
  }
  return true;
};

// ============================================================================
// AUTO-LOAD CONFIGURATION
// ============================================================================

/**
 * Automatically load configuration when this script loads
 * This ensures config is ready before any content scripts try to use it
 */
(async function initializeConfig() {
  try {
    // Wait for logger to be available
    if (!window.logger) {
      await new Promise(resolve => {
        const checkLogger = setInterval(() => {
          if (window.logger) {
            clearInterval(checkLogger);
            resolve();
          }
        }, 50);
        // Timeout after 2 seconds
        setTimeout(() => {
          clearInterval(checkLogger);
          resolve();
        }, 2000);
      });
    }

    // Load configuration from server
    await window.loadSecureConfig();

    // Validate loaded configuration
    window.validateConfig();

  } catch (error) {
    console.error('LanguageBridge initialization failed:', error);
    // Continue anyway - some features may still work with fallback config
  }
})();

// ============================================================================
// HELPER FUNCTION: Ensure Config Loaded
// ============================================================================

/**
 * Helper function for other scripts to ensure config is loaded
 * Usage: await window.ensureConfigLoaded();
 */
window.ensureConfigLoaded = async function() {
  if (window.CONFIG._isLoaded) {
    return window.CONFIG;
  }
  return await window.loadSecureConfig();
};
