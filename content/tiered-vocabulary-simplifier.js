/**
 * Tiered Vocabulary Simplifier
 */

class TieredVocabularySimplifier {
  constructor(vocabularyData) {
    this.tier3Map = new Map(); // "accumulate" -> {tier2: [...], tier1: [...], definition: "..."}
    this.tier2Reverse = new Map(); // "gather" -> "accumulate" (avoid tier2→tier2)
    this.inflectionCache = new Map(); // Cache for inflection transformations
    this.academicCollocations = {
      'conduct': ['research', 'study', 'experiment', 'analysis', 'investigation'],
      'accumulate': ['data', 'evidence', 'information', 'knowledge', 'wealth'],
      'acquire': ['knowledge', 'skills', 'language', 'data', 'information'],
      'analyze': ['data', 'results', 'information', 'evidence'],
      'assess': ['impact', 'performance', 'quality', 'results'],
      'appropriate': ['response', 'action', 'method', 'approach'],
      'significant': ['impact', 'difference', 'change', 'effect', 'amount'],
      'substantial': ['evidence', 'amount', 'impact', 'change'],
      'comprehensive': ['study', 'analysis', 'review', 'examination']
    };
    this.eslFrequency = {
      // Common tier 2 words
      'get': 50, 'go': 50, 'have': 50, 'make': 50, 'use': 50,
      'change': 200, 'help': 200, 'save': 200, 'show': 200,
      'gather': 650, 'obtain': 850, 'gain': 700,
      'achieve': 750, 'reach': 400, 'succeed': 600,

      // Academic tier 2 (important for ESL to learn)
      'acquire': 850, 'analyze': 900, 'assess': 900,
      'approach': 700, 'available': 650, 'benefit': 700,
      'category': 800, 'conclude': 850, 'conduct': 900,
      'consist': 850, 'context': 900, 'create': 500,
      'data': 700, 'define': 750, 'derive': 900,
      'distribute': 850, 'establish': 850, 'estimate': 850,
      'evaluate': 900, 'evident': 850, 'function': 700,
      'identify': 800, 'indicate': 850, 'interpret': 900,
      'involve': 750, 'issue': 650, 'major': 600,
      'method': 750, 'occur': 750, 'percent': 700,
      'period': 650, 'principle': 850, 'proceed': 900,
      'process': 700, 'require': 700, 'research': 750,
      'respond': 700, 'role': 650, 'section': 700,
      'significant': 850, 'similar': 650, 'source': 700,
      'specific': 750, 'structure': 750, 'theory': 800,
      'vary': 750, 'factor': 750, 'major': 600
    };

    // Index the vocabulary database
    if (vocabularyData && Array.isArray(vocabularyData)) {
      vocabularyData.forEach(entry => {
        const tier3Word = entry.tier3.toLowerCase();
        this.tier3Map.set(tier3Word, {
          tier2: Array.isArray(entry.tier2) ? entry.tier2 : [entry.tier2],
          tier1: Array.isArray(entry.tier1) ? entry.tier1 : [entry.tier1],
          definition: entry.definition
        });
        if (Array.isArray(entry.tier2)) {
          entry.tier2.forEach(word => {
            this.tier2Reverse.set(word.toLowerCase(), tier3Word);
          });
        }
      });

      logger.log(`✓ Loaded ${this.tier3Map.size} vocabulary entries for tiered simplification`);
    } else {
      logger.warn('⚠️ TieredVocabularySimplifier initialized without vocabulary data');
    }
  }

    // simplifyText
  simplifyText(text, targetTier = 'tier2') {
    if (!text || text.trim().length === 0) {
      return text;
    }
    const complexity = this.analyzeComplexity(text);
    let tier = targetTier;
    if (targetTier === 'auto') {
      tier = this.chooseTier(complexity);
    }
    if (tier === 'minimal' || tier === 'tier3') {
      return text;
    }
    return this.replaceWithTier(text, tier, complexity);
  }

    // analyzeComplexity
  analyzeComplexity(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];

    if (words.length === 0) {
      return { avgWordLength: 0, academicRatio: 0, tier3Count: 0, tier2Count: 0, totalWords: 0 };
    }

    // Count academic words present
    let tier3Count = 0;
    let tier2Count = 0;

    words.forEach(word => {
      const stem = window.LanguageBridgeInflectionEngine.stemWord(word);
      if (this.tier3Map.has(stem)) tier3Count++;
      if (this.tier2Reverse.has(stem)) tier2Count++;
    });

    // Calculate metrics
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const academicRatio = tier3Count / words.length;

    return {
      avgWordLength,
      academicRatio,
      tier3Count,
      tier2Count,
      totalWords: words.length
    };
  }

    // chooseTier
  chooseTier(complexity) {
    if (complexity.academicRatio > 0.20 || complexity.avgWordLength > 7) {
      return 'tier1';
    }
    return 'tier2';
  }

    // replaceWithTier
  replaceWithTier(text, tier, complexity) {
    let result = text;

    // Collect all replacements with their positions
    const replacements = [];

    this.tier3Map.forEach((entry, tier3Word) => {
      const pattern = window.LanguageBridgeInflectionEngine.createFlexiblePattern(tier3Word);
      const regex = new RegExp(pattern, 'gi');

      let match;
      const matches = [];
      while ((match = regex.exec(text)) !== null) {
        matches.push(match);
      }

      matches.forEach(match => {
        const original = match[0];
        const position = match.index;
        const context = this.getContext(text, position, 50);

        // Choose best replacement from tier array
        let tierArray = entry[tier];
        if (!tierArray || tierArray.length === 0) {
          return; // Skip if no replacement available
        }
        tierArray = tierArray.filter(word => !this.tier3Map.has(word.toLowerCase()));

        if (tierArray.length === 0) {
          return; // Skip if no valid replacements after filtering
        }

        const replacement = this.chooseBestSynonym(
          tierArray,
          context,
          tier3Word,
          original
        );
        const inflectedReplacement = window.LanguageBridgeInflectionEngine.matchInflection(original, tier3Word, replacement);

        replacements.push({
          original,
          replacement: inflectedReplacement,
          position,
          length: original.length
        });
      });
    });
    replacements.sort((a, b) => b.position - a.position);

    // Apply replacements
    replacements.forEach(r => {
      result = result.substring(0, r.position) +
               r.replacement +
               result.substring(r.position + r.length);
    });

    return result;
  }

    // chooseBestSynonym
  chooseBestSynonym(synonymArray, context, tier3Word, originalWord) {
    if (!synonymArray || synonymArray.length === 0) return originalWord;
    if (synonymArray.length === 1) return synonymArray[0];

    const contextWords = context.toLowerCase().match(/\b\w+\b/g) || [];
    const collocations = this.academicCollocations[tier3Word] || [];
    const hasAcademicCollocation = contextWords.some(word => collocations.includes(word));

    // Score each synonym
    const scores = synonymArray.map(syn => {
      let score = 0;
      if (hasAcademicCollocation) {
        const synLower = syn.toLowerCase();
        if (this.eslFrequency[synLower] && this.eslFrequency[synLower] >= 600) {
          score += 100; // Strong bonus for academic tier 2 words
        }
      }
      const frequency = this.eslFrequency[syn.toLowerCase()] || 1000;
      score += (1000 - frequency) / 10; // Lower frequency number = higher score

      // FACTOR 3: Word length (prefer shorter, simpler words)
      score += (15 - syn.length); // Bonus for shorter words

      // FACTOR 4: Avoid phrasal verbs for tier1 (harder for ESL)
      if (syn.includes(' ')) {
        score -= 20; // Penalty for multi-word expressions
      }

      return { synonym: syn, score };
    });
    scores.sort((a, b) => b.score - a.score);
    return scores[0].synonym;
  }

    // getContext
  getContext(text, position, radius) {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end);
  }

    // getStats
  getStats() {
    return {
      totalEntries: this.tier3Map.size,
      tier2Words: this.tier2Reverse.size,
      hasData: this.tier3Map.size > 0
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TieredVocabularySimplifier;
}
