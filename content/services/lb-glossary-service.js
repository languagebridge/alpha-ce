/**
 * LanguageBridge Glossary Service
 */

class LanguageBridgeGlossaryService {
  constructor() {
    this.core = window.LanguageBridgeAzureCore;
    this.translationService = window.LanguageBridgeTranslationService;
  }
  // extractKeywords
  async extractKeywords(simplifiedText, targetLanguage) {
    logger.log('📚 Extracting dynamic keywords (non-academic words only)...');

    const startTime = Date.now();
    let dbCount = 0, cacheCount = 0, apiCount = 0;
    const isEnglishMode = targetLanguage === 'en';

    if (isEnglishMode) {
      logger.log('🇺🇸 English/English mode - using Tier 1 simplification');
    }

    const vocabulary = [];

    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
      'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
      'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
      'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
      'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
      'time', 'no', 'just', 'him', 'know', 'take', 'into', 'year', 'your',
      'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
      'only', 'come', 'its', 'over', 'also', 'back', 'after', 'use', 'two',
      'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
      'because', 'any', 'these', 'give', 'most', 'us', 'is', 'was', 'are',
      'been', 'has', 'had', 'were', 'said', 'did', 'am'
    ]);

    // Extract content words from simplified text
    const words = simplifiedText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];

    // Count word frequency
    const wordFreq = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word]) => word);

    logger.log(`📝 Analyzing ${topWords.length} frequent words for vocabulary...`);
    for (const englishWord of topWords) {
      // Skip if already in vocabulary list
      if (vocabulary.some(v => v.term.toLowerCase() === englishWord)) {
        continue;
      }

      try {
        if (isEnglishMode) {
          const simplification = this.getSimplification(englishWord);
          if (simplification) {
            vocabulary.push({
              term: englishWord,
              translation: simplification,
              definition: simplification,
              context: this.findWordContext(englishWord, simplifiedText),
              source: 'database'
            });
            dbCount++;
            logger.log(`   ✓ "${englishWord}" → simplification (FREE)`);
            continue;
          }
          // For English/English, don't call API - skip this word
          logger.log(`   ⊘ "${englishWord}" → not in database, skipping (English mode)`);
          continue;
        }

        // LAYER 2: Check translation cache (non-English modes only)
        const cacheKey = `en-${targetLanguage}-${englishWord}`;
        if (this.core.translationCache.has(cacheKey)) {
          const cachedTranslation = this.core.translationCache.get(cacheKey);
          vocabulary.push({
            term: englishWord,
            translation: cachedTranslation,
            context: this.findWordContext(englishWord, simplifiedText),
            source: 'cache'
          });
          cacheCount++;
          logger.log(`   ✓ "${englishWord}" → cache (FREE)`);
          continue;
        }

        // LAYER 3: API call (last resort - costs money!)
        const wordTranslation = await this.translationService.translateText(englishWord, 'en', targetLanguage);

        if (wordTranslation && wordTranslation !== englishWord) {
          vocabulary.push({
            term: englishWord,
            translation: wordTranslation,
            context: this.findWordContext(englishWord, simplifiedText),
            source: 'api'
          });
          apiCount++;
          logger.log(`   💰 "${englishWord}" → API (COST)`);
        }

      } catch (error) {
        logger.warn(`Could not get translation for: ${englishWord}`, error);
      }

      // Limit to 8 total terms
      if (vocabulary.length >= 8) break;
    }

    const totalTime = Date.now() - startTime;
    const savingsPercent = vocabulary.length > 0
      ? Math.round(((dbCount + cacheCount) / vocabulary.length) * 100)
      : 0;

    logger.log(`✓ Extracted ${vocabulary.length} vocabulary words in ${totalTime}ms`);
    logger.log(`   📚 Database: ${dbCount} (FREE)`);
    logger.log(`   💾 Cache: ${cacheCount} (FREE)`);
    logger.log(`   💰 API: ${apiCount} (COST)`);
    logger.log(`   💰 Cost savings: ${savingsPercent}% (${dbCount + cacheCount}/${vocabulary.length} free)`);

    return vocabulary;
  }
  async buildGlossaryForTier(originalText, simplifiedText, targetLanguage, tier) {
    // TIER 1: Simple vocabulary practice words
    if (tier === 1) {
      return await this.buildTier1Glossary(simplifiedText, targetLanguage);
    }

    // TIER 3: Multi-syllable words from original text
    if (tier === 3) {
      return await this.buildTier3Glossary(originalText, targetLanguage);
    }

    // TIER 2: Dynamic keywords from text
    return await this.extractKeywords(simplifiedText, targetLanguage);
  }
  async buildTier1Glossary(simplifiedText, targetLanguage) {
    try {
      // Extract all words from simplified text
      const words = simplifiedText.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 3);

      // Common function words to skip
      const skipWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
        'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
        'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy',
        'did', 'man', 'she', 'too', 'use', 'way', 'about', 'after', 'again',
        'before', 'could', 'from', 'into', 'just', 'like', 'make', 'many',
        'more', 'over', 'such', 'take', 'than', 'them', 'then', 'there',
        'these', 'they', 'this', 'very', 'were', 'what', 'when', 'where',
        'which', 'while', 'with', 'would', 'your'
      ]);

      // Count word frequency
      const wordFreq = {};
      words.forEach(word => {
        if (!skipWords.has(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });

      // Select 6-8 most common content words
      const selectedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);

      // PARALLEL translation for 5x faster loading!
      const translationPromises = selectedWords.map(word =>
        this.translationService.translateText(word, 'en', targetLanguage)
          .catch(error => {
            logger.warn(`Could not translate TIER 1 word: ${word}`, error);
            return word;
          })
      );

      // Wait for all translations to complete in parallel
      const translations = await Promise.all(translationPromises);
      const glossary = selectedWords.map((word, i) => ({
        term: word,
        translation: translations[i] || word,
        tier: 1,
        subject: 'Basic Vocabulary',
        source: 'tier1_practice'
      }));

      logger.log(`✓ TIER 1 Glossary: ${glossary.length} practice words for beginners (parallel translations)`);
      return glossary;

    } catch (error) {
      logger.error('Error building TIER 1 glossary:', error);
      return [];
    }
  }
  async buildTier3Glossary(originalText, targetLanguage) {
    try {
      // Extract all words from original text
      const words = originalText
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 6);

      // Count syllables
      const countSyllables = (word) => {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;

        const syllableRegex = /[aeiouy]+/g;
        const matches = word.match(syllableRegex);
        let count = matches ? matches.length : 1;

        // Adjust for silent 'e'
        if (word.endsWith('e')) count--;

        return Math.max(1, count);
      };

      // Find multi-syllable words (3+ syllables)
      const complexWords = {};
      words.forEach(word => {
        const syllables = countSyllables(word);
        if (syllables >= 3) {
          const wordLower = word.toLowerCase();
          if (!complexWords[wordLower]) {
            complexWords[wordLower] = {
              word: word,
              syllables: syllables,
              frequency: 1
            };
          } else {
            complexWords[wordLower].frequency++;
          }
        }
      });

      // Select 6-8 most complex/frequent words
      const selectedWords = Object.values(complexWords)
        .sort((a, b) => {
          if (b.syllables !== a.syllables) return b.syllables - a.syllables;
          return b.frequency - a.frequency;
        })
        .slice(0, 8);

      // PARALLEL translation for 5x faster loading!
      const translationPromises = selectedWords.map(wordObj =>
        this.translationService.translateText(wordObj.word, 'en', targetLanguage)
          .catch(error => {
            logger.warn(`Could not translate TIER 3 word: ${wordObj.word}`, error);
            return wordObj.word;
          })
      );

      // Wait for all translations to complete in parallel
      const translations = await Promise.all(translationPromises);
      const glossary = selectedWords.map((wordObj, i) => ({
        term: wordObj.word,
        translation: translations[i] || wordObj.word,
        tier: 3,
        subject: 'Advanced Vocabulary',
        source: 'tier3_multisyllable'
      }));

      logger.log(`✓ TIER 3 Glossary: ${glossary.length} multi-syllable words for vocabulary building (parallel translations)`);
      return glossary;

    } catch (error) {
      logger.error('Error building TIER 3 glossary:', error);
      return [];
    }
  }
  async fetchAllScaffoldingTiers(originalText, targetLanguage, userTier = 2) {
    logger.log(`🔄 Fetching translation + TIER ${userTier} glossary...`);

    try {
      // Translate to native language, then build glossary from original text
      const translation = targetLanguage !== 'en'
        ? await this.translationService.translateText(originalText, 'en', targetLanguage)
        : originalText;

      // LAZY LOAD: Only fetch glossary for user's preferred tier
      const preferredGlossary = await this.buildGlossaryForTier(originalText, originalText, targetLanguage, userTier);

      logger.log(`✓ Translation + TIER ${userTier} glossary loaded (${preferredGlossary?.length || 0} terms)`);

      return {
        translation,
        glossary: preferredGlossary,
        preferredTier: userTier,
        glossaryTier1: userTier === 1 ? preferredGlossary : 'NOT_LOADED',
        glossaryTier2: userTier === 2 ? preferredGlossary : 'NOT_LOADED',
        glossaryTier3: userTier === 3 ? preferredGlossary : 'NOT_LOADED'
      };

    } catch (error) {
      logger.error('Error fetching scaffolding tiers:', error);
      return {
        translation: originalText,
        glossary: [],
        preferredTier: userTier,
        glossaryTier1: 'NOT_LOADED',
        glossaryTier2: 'NOT_LOADED',
        glossaryTier3: 'NOT_LOADED'
      };
    }
  }
  getSimplification(word) {
    const wordMap = {
      'photosynthesis': 'how plants make food',
      'chloroplast': 'plant part',
      'chloroplasts': 'plant parts',
      'chlorophyll': 'green chemical',
      'organism': 'living thing',
      'organisms': 'living things',
      'transform': 'change',
      'transforms': 'changes',
      'convert': 'change',
      'converts': 'changes',
      'utilize': 'use',
      'utilizes': 'uses',
      'comprehend': 'understand',
      'comprehends': 'understands',
      'acquire': 'get',
      'acquires': 'gets',
      'demonstrate': 'show',
      'demonstrates': 'shows',
      'indicate': 'show',
      'indicates': 'shows',
      'examine': 'look at',
      'examines': 'looks at',
      'investigate': 'study',
      'investigates': 'studies',
      'numerous': 'many',
      'abundant': 'many',
      'significant': 'important',
      'substantial': 'large',
      'approximately': 'about',
      'consequently': 'so',
      'therefore': 'so',
      'however': 'but',
      'nevertheless': 'but',
      'furthermore': 'also',
      'additionally': 'also',
      'subsequently': 'later',
      'initially': 'first',
      'ultimately': 'finally',
      'primarily': 'mainly',
      'essential': 'needed',
      'crucial': 'important',
      'vital': 'important',
      'obtain': 'get',
      'obtains': 'gets',
      'possess': 'have',
      'possesses': 'has',
      'contain': 'have',
      'contains': 'has',
      'comprise': 'include',
      'comprises': 'includes',
      'establish': 'set up',
      'establishes': 'sets up',
      'maintain': 'keep',
      'maintains': 'keeps',
      'facilitate': 'help',
      'facilitates': 'helps',
      'require': 'need',
      'requires': 'needs',
      'component': 'part',
      'components': 'parts',
      'function': 'job',
      'functions': 'jobs',
      'procedure': 'process',
      'procedures': 'processes',
      'capability': 'ability',
      'capabilities': 'abilities'
    };

    return wordMap[word.toLowerCase()] || null;
  }
  findWordContext(word, text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const sentence = sentences.find(s =>
      s.toLowerCase().includes(word.toLowerCase())
    );
    return sentence ? sentence.trim() : '';
  }
}

// Export to global namespace
window.LanguageBridgeGlossaryService = new LanguageBridgeGlossaryService();
