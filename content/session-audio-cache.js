/**
 * Session-Only Audio Cache for LanguageBridge
 */

class SessionAudioCache {
  constructor() {
    // In-memory cache (Map structure for fast lookups)
    this.cache = new Map();

    // Cache statistics for monitoring
    this.stats = {
      hits: 0,
      misses: 0,
      englishBrowserTTS: 0,
      azureTTS: 0,
      cacheSize: 0
    };

    // Maximum cache entries (prevent memory bloat)
    this.maxEntries = 100;

    logger.log('✓ Session audio cache initialized (memory-only)');
  }

    // getCacheKey
  getCacheKey(text, language, rate = 1.0) {
    // Normalize text (trim, lowercase for consistency)
    const normalizedText = text.trim().toLowerCase();
    return `${language}:${rate}:${normalizedText}`;
  }

    // get
  get(text, language, rate = 1.0) {
    const key = this.getCacheKey(text, language, rate);

    if (this.cache.has(key)) {
      this.stats.hits++;
      logger.log(`🎯 Cache HIT: ${language}:${text.substring(0, 20)}...`);
      return this.cache.get(key);
    }

    this.stats.misses++;
    return null;
  }

    // set
  set(text, language, rate = 1.0, audioData) {
    const key = this.getCacheKey(text, language, rate);

    // Enforce max cache size (LRU-style: remove oldest)
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      logger.log(`🗑️ Cache full - removed oldest entry`);
    }

    this.cache.set(key, audioData);
    this.stats.cacheSize = this.cache.size;
    logger.log(`💾 Cached audio: ${language}:${text.substring(0, 20)}... (${this.cache.size}/${this.maxEntries})`);
  }

    // getStats
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalRequests: this.stats.hits + this.stats.misses
    };
  }
  clear() {
    this.cache.clear();
    const stats = this.getStats();
    logger.log(`🗑️ Session cache cleared. Stats: ${stats.hits} hits, ${stats.misses} misses (${stats.hitRate} hit rate)`);

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      englishBrowserTTS: 0,
      azureTTS: 0,
      cacheSize: 0
    };
  }

    // playAudio
  async playAudio(text, language, rate = 1.0, azureClient = null) {
    const cached = this.get(text, language, rate);
    if (cached) {
      await this.playAudioData(cached, language);
      return;
    }

    // Not in cache - generate new audio
    if (language === 'en') {
      // Use FREE browser TTS for English
      await this.playWithBrowserTTS(text, rate);
      this.stats.englishBrowserTTS++;
    } else {
      // Use Azure TTS for other languages (necessary)
      if (!azureClient) {
        throw new Error('Azure client required for non-English TTS');
      }
      await azureClient.speakText(text, language, { rate });
      this.stats.azureTTS++;
      // because Azure SDK handles playback internally
    }
  }

    // playWithBrowserTTS
  playWithBrowserTTS(text, rate = 1.0) {
    if (!('speechSynthesis' in window)) {
      logger.warn('Browser TTS not supported');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        // Cache the utterance settings for next time
        this.set(text, 'en', rate, { type: 'browser-tts', utterance: utterance.text });
        resolve();
      };

      utterance.onerror = (error) => {
        logger.warn('Browser TTS error:', error);
        resolve(); // Resolve even on error
      };

      window.speechSynthesis.speak(utterance);
      logger.log(`🔊 Playing with browser TTS: "${text.substring(0, 30)}..." (rate: ${rate})`);
    });
  }

    // playAudioData
  async playAudioData(audioData, language) {
    if (audioData.type === 'browser-tts') {
      // Re-play with browser TTS
      const utterance = new SpeechSynthesisUtterance(audioData.utterance);
      utterance.lang = language === 'en' ? 'en-US' : language;

      return new Promise((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }

    // For Azure TTS cached audio, we'd play the blob here
    // (Not implemented yet - Azure SDK handles playback)
  }
}
if (typeof window !== 'undefined') {
  window.sessionAudioCache = new SessionAudioCache();

  // Clear cache when page unloads (session ends)
  window.addEventListener('beforeunload', () => {
    window.sessionAudioCache.clear();
  });

  // Log cache stats periodically (for development/debugging)
  if (window.CONFIG?.isDevelopment) {
    setInterval(() => {
      const stats = window.sessionAudioCache.getStats();
      if (stats.totalRequests > 0) {
        logger.log('📊 Audio cache stats:', stats);
      }
    }, 60000); // Every minute
  }
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionAudioCache;
}
