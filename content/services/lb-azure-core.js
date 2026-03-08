/**
 * LanguageBridge Azure Core
 */

class LanguageBridgeAzureCore {
  constructor() {
    this.config = {
      // Netlify proxy endpoint (no keys needed in extension)
      netlifyEndpoint: null, // Will be set after config loads
    };

    // Caching (saves API calls and money)
    this.translationCache = new Map();
    this.simplificationCache = new Map();
    this.glossaryCache = new Map();
    this.maxCacheSize = 100; // Default, will be updated after config loads

    // Rate limiting (API abuse prevention)
    this.rateLimiters = {
      translations: { count: 0, resetAt: Date.now() + 60000 },
      tts: { count: 0, resetAt: Date.now() + 60000 },
      speechRecognition: { count: 0, resetAt: Date.now() + 60000 }
    };

    this.tieredSimplifier = null;
    this.isInitialized = false;

    // Initialize after config is loaded
    this.init();
  }

  async init() {
    // Wait for config to be loaded before initializing
    try {
      if (typeof window.ensureConfigLoaded === 'function') {
        await window.ensureConfigLoaded();

        // Now set endpoints from loaded config
        this.config.netlifyEndpoint = window.CONFIG.endpoints.azureProxy;
        this.maxCacheSize = window.CONFIG.features.maxCacheSize || 100;
      } else {
        logger.warn('⚠️ Config loader not available, waiting...');
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (window.CONFIG && window.CONFIG.endpoints) {
          this.config.netlifyEndpoint = window.CONFIG.endpoints.azureProxy;
          this.maxCacheSize = window.CONFIG.features?.maxCacheSize || 100;
        }
      }
    } catch (error) {
      logger.error('❌ Failed to load config for Azure Core:', error);
      // Set fallback endpoint
      this.config.netlifyEndpoint = 'https://exquisite-croissant-4288dd.netlify.app/.netlify/functions/azure-proxy';
    }

    this.isInitialized = true;
    logger.log('✓ Azure Core initialized with Netlify proxy');
    logger.log(`✓ Azure proxy endpoint: ${this.config.netlifyEndpoint || 'not set'}`);
    logger.log('✓ TTS: Using Azure proxy (no direct SDK)');
    logger.log('✓ Rate limiting enabled for API protection');

    // Load tiered vocabulary database
    await this.loadTieredVocabulary();
  }
  async loadTieredVocabulary() {
    try {
      logger.log('🔍 Loading tiered vocabulary database...');
      const response = await fetch(chrome.runtime.getURL('plain_english_a_to_z-1.json'));
      const vocabularyData = await response.json();
      logger.log(`✓ Vocabulary JSON loaded: ${vocabularyData.length} entries`);

      if (typeof TieredVocabularySimplifier !== 'undefined') {
        logger.log('✓ TieredVocabularySimplifier class is defined');
        this.tieredSimplifier = new TieredVocabularySimplifier(vocabularyData);
        const stats = this.tieredSimplifier.getStats();
        logger.log(`✓ Tiered vocabulary loaded: ${stats.totalEntries} academic terms`);
        logger.log('✓ ESL-optimized Tier 2 simplification enabled');
      } else {
        logger.error('❌ TieredVocabularySimplifier is UNDEFINED - falling back to legacy');
        this.tieredSimplifier = null;
      }
    } catch (error) {
      logger.error('❌ Could not load tiered vocabulary database:', error);
      this.tieredSimplifier = null;
    }
  }
  checkRateLimit(service) {
    const limiter = this.rateLimiters[service];
    const now = Date.now();

    // Reset counter if time window has passed
    if (now >= limiter.resetAt) {
      limiter.count = 0;
      limiter.resetAt = now + 60000;
    }
    const limits = {
      translations: window.CONFIG.rateLimits.translationsPerMinute,
      tts: window.CONFIG.rateLimits.ttsRequestsPerMinute,
      speechRecognition: window.CONFIG.rateLimits.speechRecognitionPerMinute
    };

    const limit = limits[service] || 30;
    if (limiter.count >= limit) {
      const waitTime = Math.ceil((limiter.resetAt - now) / 1000);
      logger.log(`⚠️ Rate limit exceeded for ${service}. Please wait ${waitTime} seconds.`);
      return false;
    }

    // Increment counter
    limiter.count++;
    return true;
  }
  getCachedTranslation(key) {
    return this.translationCache.get(key);
  }
  setCachedTranslation(key, value) {
    // Prevent cache from growing indefinitely
    if (this.translationCache.size >= this.maxCacheSize) {
      const firstKey = this.translationCache.keys().next().value;
      this.translationCache.delete(firstKey);
    }
    this.translationCache.set(key, value);
  }
  clearCache(cacheType = 'all') {
    if (cacheType === 'all' || cacheType === 'translation') {
      this.translationCache.clear();
    }
    if (cacheType === 'all' || cacheType === 'simplification') {
      this.simplificationCache.clear();
    }
    if (cacheType === 'all' || cacheType === 'glossary') {
      this.glossaryCache.clear();
    }
  }
}

// Export to global namespace
window.LanguageBridgeAzureCore = new LanguageBridgeAzureCore();
