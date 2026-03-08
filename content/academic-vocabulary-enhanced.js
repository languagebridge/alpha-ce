/**
 * Enhanced Academic Vocabulary System
 */

// This will be populated when the JSON loads
let VOCABULARY_DATABASE = [];
async function loadVocabularyDatabase() {
  try {
    const response = await fetch(chrome.runtime.getURL('plain_english_a_to_z-1.json'));
    VOCABULARY_DATABASE = await response.json();
    logger.log(`✓ Loaded ${VOCABULARY_DATABASE.length} academic terms with tier metadata`);
    return true;
  } catch (error) {
    logger.error('Failed to load vocabulary database:', error);
    return false;
  }
}
function findAcademicTerms(text, targetLanguage = 'en', userTier = 2) {
  if (!text || text.trim().length === 0 || VOCABULARY_DATABASE.length === 0) {
    return [];
  }

  // Normalize text for matching
  const normalizedText = text.toLowerCase();
  const words = normalizedText.match(/\b[a-z]+\b/g) || [];

  // Find matches in our database
  const matches = [];
  const matchedTerms = new Set();

  for (const word of words) {
    // Skip if already matched
    if (matchedTerms.has(word)) continue;
    const entry = VOCABULARY_DATABASE.find(v => {
      const term = v.tier3.toLowerCase();
      return term === word ||
             term === word + 's' ||  // Handle plurals
             term === word + 'es' ||
             term + 's' === word ||   // Reverse (e.g., "analyzes" -> "analyze")
             term + 'es' === word;
    });

    if (entry) {
      matchedTerms.add(word);

      // Extract sentence containing the word for context
      const sentenceRegex = new RegExp(`[^.!?]*\\b${word}\\b[^.!?]*[.!?]`, 'i');
      const sentenceMatch = text.match(sentenceRegex);
      const contextSentence = sentenceMatch ? sentenceMatch[0].trim() : null;
      let definition;
      if (userTier === 1) {
        // TIER 1: Use simplest definition
        definition = entry.tier1?.[0] || entry.tier2?.[0] || entry.definition || 'basic term';
      } else if (userTier === 3) {
        // TIER 3: Use original definition
        definition = entry.definition || entry.tier2?.[0] || 'academic term';
      } else {
        // TIER 2: Use intermediate definition (default)
        definition = entry.tier2?.[0] || entry.definition || 'academic term';
      }

      matches.push({
        term: entry.tier3, // Always show original academic word
        definition: definition, // Definition adapts to user's tier
        simple_definition: entry.tier1?.[0] || entry.tier2?.[0] || 'basic term',
        tier: entry.tier || 2,
        subject: entry.subject || 'General',
        contextSentence: contextSentence,
        cognate: null, // No cognates in Plain English A-Z yet
        // Include all tier alternatives for reference
        tier1_alternatives: entry.tier1 || [],
        tier2_alternatives: entry.tier2 || [],
        tier3_original: entry.tier3
      });
    }
  }

  // TIER-BASED PRIORITIZATION
  matches.sort((a, b) => {
    // Higher tier = higher priority (Tier 3 > Tier 2 > Tier 1)
    if (a.tier !== b.tier) {
      return b.tier - a.tier; // Sort descending (3, 2, 1)
    }
    // Same tier - maintain order of appearance (stable sort)
    return 0;
  });

  // Limit to top 5 terms
  return matches.slice(0, 5);
}
function findTerm(word, targetLanguage = 'en', userTier = 2) {
  const entry = VOCABULARY_DATABASE.find(v =>
    v.tier3.toLowerCase() === word.toLowerCase()
  );

  if (entry) {
    let definition;
    if (userTier === 1) {
      // TIER 1: Use simplest definition
      definition = entry.tier1?.[0] || entry.tier2?.[0] || entry.definition || 'basic term';
    } else if (userTier === 3) {
      // TIER 3: Use original definition from JSON
      definition = entry.definition || entry.tier2?.[0] || 'academic term';
    } else {
      // TIER 2: Use intermediate definition (default)
      definition = entry.tier2?.[0] || entry.definition || 'academic term';
    }

    return {
      term: entry.tier3, // Always show the original academic word
      definition: definition, // Definition adapts to user's tier
      simple_definition: entry.tier1?.[0] || entry.tier2?.[0] || 'basic term',
      tier: entry.tier || 2,
      subject: entry.subject || 'General',
      cognate: null, // No cognates in Plain English A-Z yet
      // Include all tier alternatives for reference
      tier1_alternatives: entry.tier1 || [],
      tier2_alternatives: entry.tier2 || [],
      tier3_original: entry.tier3
    };
  }

  return null;
}
function getCognate(term, language) {
  return null;
}

// Auto-load vocabulary when script loads
if (typeof chrome !== 'undefined' && chrome.runtime) {
  loadVocabularyDatabase();
}

// Export for use in extension
if (typeof window !== 'undefined') {
  window.AcademicVocabulary = {
    findTerms: findAcademicTerms,
    findTerm: findTerm,
    getCognate: getCognate,
    database: VOCABULARY_DATABASE,
    reload: loadVocabularyDatabase
  };
}

// For Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findTerms: findAcademicTerms,
    findTerm: findTerm,
    getCognate: getCognate
  };
}
