/**
 * LanguageBridge Translation Service
 */

class LanguageBridgeTranslationService {
  constructor() {
    this.core = window.LanguageBridgeAzureCore;
  }
  async translateText(text, fromLang, toLang) {
    const cacheKey = `${fromLang}-${toLang}-${text.toLowerCase().trim()}`;
    const cached = this.core.getCachedTranslation(cacheKey);
    if (cached) {
      logger.log('✓ Translation retrieved from cache (saved API call!)');
      return cached;
    }
    if (!this.core.checkRateLimit('translations')) {
      throw new Error('Translation rate limit exceeded. Please wait a moment and try again.');
    }

    // Translate via Netlify proxy
    logger.log(`🌍 Translating text (${fromLang} → ${toLang})`);
    return await this.translateWithNetlify(text, fromLang, toLang, cacheKey);
  }
  async translateWithNetlify(text, fromLang, toLang, cacheKey) {
    const startTime = Date.now();

    try {
      // Wait for Azure Core to be initialized
      if (!this.core.isInitialized) {
        logger.log('⏳ Waiting for Azure Core to initialize...');
        let attempts = 0;
        while (!this.core.isInitialized && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        if (!this.core.isInitialized) {
          throw new Error('Azure Core failed to initialize');
        }
      }

      // Check if endpoint is set
      if (!this.core.config.netlifyEndpoint) {
        throw new Error('Translation endpoint not configured');
      }

      // Get tier preference (no analytics for alpha)
      const settings = await chrome.storage.sync.get(['simplificationTier']);
      const deploymentType = window.CONFIG.deploymentType || 'alpha-pilot';
      const simplificationTier = settings.simplificationTier || 2; // Default to Tier 2

      // Call Netlify proxy (no analytics for alpha)
      const response = await fetch(this.core.config.netlifyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Deployment-Type': deploymentType,
          'X-Simplification-Tier': simplificationTier.toString()
        },
        body: JSON.stringify({
          service: 'translate',
          data: {
            text: text,
            sourceLanguage: fromLang,
            targetLanguage: toLang
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Netlify proxy error details:', errorText);

        await window.LanguageBridgeErrorHandler.trackError('translations', {
          charCount: text.length,
          language: toLang,
          errorMessage: `HTTP ${response.status}: ${errorText}`,
          responseTime: Date.now() - startTime
        });

        throw new Error(`Translation proxy error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const translatedText = data.translation || text;

      // Store in cache
      this.core.setCachedTranslation(cacheKey, translatedText);

      // Track successful API call
      await window.LanguageBridgeErrorHandler.trackSuccess('translations', {
        charCount: text.length,
        language: toLang,
        responseTime: Date.now() - startTime
      });

      // Track analytics (async, non-blocking)
      if (window.LanguageBridgeAnalytics) {
        window.LanguageBridgeAnalytics.trackTranslation(fromLang, toLang, text.length).catch(err => {
          // Silently fail - analytics should never break functionality
          console.warn('Analytics tracking failed:', err.message);
        });
      }

      logger.log(`✓ Translation complete (via Netlify proxy)`);
      return translatedText;
    } catch (error) {
      logger.error('Azure Translator error:', error);
      logger.warn('⚠️ Returning original text due to translation error');

      // Track error if not already tracked
      if (!error.message.includes('HTTP')) {
        await window.LanguageBridgeErrorHandler.trackError('translations', {
          charCount: text.length,
          language: toLang,
          errorMessage: error.message,
          responseTime: Date.now() - startTime
        });
      }

      if (window.LanguageBridgeToolbar) {
        window.LanguageBridgeToolbar.showStatus('Translation unavailable — check connection', 'error');
      }

      return text;
    }
  }
}

// Export to global namespace
window.LanguageBridgeTranslationService = new LanguageBridgeTranslationService();
