/**
 * LanguageBridge - Azure Client Facade
 */

class AzureClient {
  constructor() {
    // Reference all service layers
    this.core = window.LanguageBridgeAzureCore;
    this.translationService = window.LanguageBridgeTranslationService;
    this.ttsService = window.LanguageBridgeTTSService;
    this.sttService = window.LanguageBridgeSTTService;
    this.simplificationService = window.LanguageBridgeSimplificationService;
    this.glossaryService = window.LanguageBridgeGlossaryService;

    // Legacy properties for backward compatibility
    this.config = this.core.config;
    this.translationCache = this.core.translationCache;
    this.simplificationCache = this.core.simplificationCache;
    this.glossaryCache = this.core.glossaryCache;
    this.maxCacheSize = this.core.maxCacheSize;
    this.rateLimiters = this.core.rateLimiters;
    this.tieredSimplifier = this.core.tieredSimplifier;
    this.isInitialized = this.core.isInitialized;

    // Legacy STT/TTS properties
    this.recognizer = null;
    this.synthesizer = null;
  }
  // Core Infrastructure Methods (delegate to Azure Core)

  async init() {
    return this.core.init();
  }

  async loadTieredVocabulary() {
    return this.core.loadTieredVocabulary();
  }

  checkRateLimit(service) {
    return this.core.checkRateLimit(service);
  }

  // Translation Methods (delegate to Translation Service)

  async translateText(text, fromLang, toLang) {
    return this.translationService.translateText(text, fromLang, toLang);
  }

  async translateWithNetlify(text, fromLang, toLang, cacheKey) {
    return this.translationService.translateWithNetlify(text, fromLang, toLang, cacheKey);
  }
  // Text-to-Speech Methods (delegate to TTS Service)

  async speakText(text, language, options = {}) {
    return this.ttsService.speakText(text, language, options);
  }

  stopSpeaking() {
    this.ttsService.stopSpeaking();
  }

  pauseSpeaking() {
    this.ttsService.pauseSpeaking();
  }
  // Speech-to-Text Methods (delegate to STT Service)

  async startSpeechRecognition(language) {
    const controller = await this.sttService.startSpeechRecognition(language);
    this.recognizer = this.sttService.recognizer;
    return controller;
  }

  startWebSpeechRecognition(locale) {
    return this.sttService.startWebSpeechRecognition(locale);
  }

  async stopSpeechRecognition() {
    await this.sttService.stopSpeechRecognition();
    this.recognizer = null;
  }
  // Simplification Methods (delegate to Simplification Service)

  async simplifyText(text) {
    return this.simplificationService.simplifyText(text);
  }

  extractiveSummarize(text, glossaryTerms = [], targetTier = 'tier2') {
    return this.simplificationService.extractiveSummarize(text, glossaryTerms, targetTier);
  }

  simplifyVocabulary(text, glossaryTerms = [], targetTier = 'tier2') {
    return this.simplificationService.simplifyVocabulary(text, glossaryTerms, targetTier);
  }

  scoreSentencesForSimplicity(sentences, fullText) {
    return this.simplificationService.scoreSentencesForSimplicity(sentences, fullText);
  }

  breakLongSentences(sentence) {
    return this.simplificationService.breakLongSentences(sentence);
  }

  removeFluff(text) {
    return this.simplificationService.removeFluff(text);
  }

  shortenForTier1(text) {
    return this.simplificationService.shortenForTier1(text);
  }

  countSyllables(word) {
    return this.simplificationService.countSyllables(word);
  }
  // Glossary Methods (delegate to Glossary Service)

  async extractAcademicTerms(text, targetLanguage, userTier = 2) {
    return this.glossaryService.extractAcademicTerms(text, targetLanguage, userTier);
  }

  async extractKeywords(simplifiedText, targetLanguage) {
    return this.glossaryService.extractKeywords(simplifiedText, targetLanguage);
  }

  async buildGlossaryForTier(originalText, simplifiedText, targetLanguage, tier) {
    return this.glossaryService.buildGlossaryForTier(originalText, simplifiedText, targetLanguage, tier);
  }

  async buildTier1Glossary(simplifiedText, targetLanguage) {
    return this.glossaryService.buildTier1Glossary(simplifiedText, targetLanguage);
  }

  async buildTier3Glossary(originalText, targetLanguage) {
    return this.glossaryService.buildTier3Glossary(originalText, targetLanguage);
  }

  async fetchAllScaffoldingTiers(originalText, targetLanguage, userTier = 2) {
    return this.glossaryService.fetchAllScaffoldingTiers(originalText, targetLanguage, userTier);
  }

  getSimplification(word) {
    return this.glossaryService.getSimplification(word);
  }

  findWordContext(word, text) {
    return this.glossaryService.findWordContext(word, text);
  }
  // Error Handling (delegate to Error Handler)

  async trackError(service, details) {
    return window.LanguageBridgeErrorHandler.trackError(service, details);
  }

  async trackSuccess(service, details) {
    return window.LanguageBridgeErrorHandler.trackSuccess(service, details);
  }
  // Legacy Utility Methods (keep for backward compatibility)

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  showSubscriptionError(message) {
    logger.error('Azure subscription error:', message);
    if (window.LanguageBridgeToolbar) {
      window.LanguageBridgeToolbar.showStatus(
        '⚠️ Azure service unavailable - using fallback',
        'error'
      );
    }
  }

  extractSimpleDefinition(definition) {
    if (!definition) return null;

    let simplified = definition
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/^process (of|by which)\s+/i, '')
      .replace(/^refers to\s+/i, '')
      .replace(/^means\s+/i, '')
      .replace(/^is defined as\s+/i, '');

    const firstClause = simplified.split(/[;,]|(?:\s+that\s+)|(?:\s+which\s+)/i)[0];

    if (firstClause && firstClause.length <= 40) {
      return firstClause.trim();
    }

    return null;
  }
}

// Export to global namespace
window.AzureClient = new AzureClient();
