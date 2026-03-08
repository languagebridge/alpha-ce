/**
 * LanguageBridge Simplification Service
 *
 * NEW PHILOSOPHY (Concept Extraction):
 * - Extract WHO/WHAT + ACTION + CONTEXT
 * - Rebuild as complete sentence with appropriate vocabulary
 * - NEVER truncate mid-sentence
 *
 * Tier 3: Original academic text
 * Tier 2: Key concept with simplified vocabulary (complete sentence)
 * Tier 1: Core concept with elementary vocabulary (complete sentence)
 */

class LanguageBridgeSimplificationService {
  constructor() {
    this.core = window.LanguageBridgeAzureCore;
  }

  async simplifyText(text) {
    if (!text || text.trim().length === 0) {
      return text;
    }

    const startTime = Date.now();
    const cacheKey = `simplify-${text}`;
    if (this.core.simplificationCache.has(cacheKey)) {
      logger.log('✓ Using cached summary');
      return this.core.simplificationCache.get(cacheKey);
    }

    logger.log('📝 Using concept extraction (no API needed)');
    let glossaryTerms = [];
    try {
      if (window.AcademicVocabulary) {
        logger.log('📚 Fetching academic terms for enhanced simplification...');
        glossaryTerms = window.AcademicVocabulary.findTerms(text, 'en');
      }
    } catch (error) {
      logger.warn('Could not fetch glossary terms:', error);
    }

    const summary = this.extractConcept(text, glossaryTerms, 'tier2');
    logger.log(`✓ TIER 2 text: ${summary}`);

    // Cache the result
    this.core.simplificationCache.set(cacheKey, summary);

    // Limit cache size
    if (this.core.simplificationCache.size > this.core.maxCacheSize) {
      const firstKey = this.core.simplificationCache.keys().next().value;
      this.core.simplificationCache.delete(firstKey);
    }

    logger.log(`✓ Concept extraction complete (${Date.now() - startTime}ms)`);
    return summary;
  }

  /**
   * Extract the core concept and rebuild as a complete sentence
   */
  extractConcept(text, glossaryTerms = [], targetTier = 'tier2') {
    logger.log(`🔍 extractConcept called with tier: ${targetTier}`);

    const cleanedText = text.replace(/\[\d+\]/g, '').trim();

    // Detect content type
    const contentType = this.detectContentType(cleanedText);
    logger.log(`📋 Content type detected: ${contentType}`);

    // Extract components based on content type
    let components = this.extractComponents(cleanedText, contentType);

    // Rebuild as complete sentence
    let result = this.rebuildSentence(components, contentType, targetTier, cleanedText);

    // Apply vocabulary simplification
    result = this.simplifyVocabulary(result, glossaryTerms, targetTier);

    return result;
  }

  /**
   * LEGACY METHOD - Keep for backwards compatibility
   * Redirects to extractConcept
   */
  extractiveSummarize(text, glossaryTerms = [], targetTier = 'tier2') {
    return this.extractConcept(text, glossaryTerms, targetTier);
  }

  /**
   * Detect the type of content to apply appropriate extraction strategy
   */
  detectContentType(text) {
    // Biography: Person name + (dates) or "was/is a [profession]"
    if (text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z'"]+)+)\s+\([^)]*\d{4}[^)]*\)/i) ||
        text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z'"]+)+)\s+(was|is)\s+an?\s+/i)) {
      return 'biography';
    }

    // Definition: "X is a Y that..." or "X means..." or "X refers to..."
    if (text.match(/^([A-Z][^.]+?)\s+(is|are|means|refers to)\s+(a|an|the)\s+/i)) {
      return 'definition';
    }

    // Process/How-to: "To X..." or "The process of..." or step indicators
    if (text.match(/^(To\s+|In order to|The process of|The method of|First|Step)/i)) {
      return 'process';
    }

    // Event/Historical: Dates + organization/event + action
    if (text.match(/In\s+(the\s+)?\d{4}[-–]\d{2,4}/i) ||
        text.match(/(season|year|period|era|age)\s*,?\s*[A-Z]/i)) {
      return 'event';
    }

    // Cause/Effect: "because", "led to", "caused", "resulted in"
    if (text.match(/\b(because|led to|caused|resulted in|therefore|thus)\b/i)) {
      return 'causeEffect';
    }

    // Formula/Math: Contains numbers, equals, mathematical terms
    if (text.match(/\b(equation|formula|equals|multiply|divide|\d+\s*[+\-×÷=]\s*\d+)/i)) {
      return 'formula';
    }

    // Default: general information
    return 'general';
  }

  /**
   * Extract key components from text based on content type
   */
  extractComponents(text, contentType) {
    const components = {
      subject: null,
      action: null,
      object: null,
      context: null,
      time: null,
      place: null
    };

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const firstSentence = sentences[0];

    switch (contentType) {
      case 'biography':
        // Extract: Name + profession/role + key accomplishment
        const bioMatch = firstSentence.match(/^([A-Z][^(]+?)(?:\s+\([^)]+\))?\s+(was|is)\s+an?\s+([^,.]+)/i);
        if (bioMatch) {
          components.subject = bioMatch[1].trim();
          components.action = bioMatch[2];
          components.object = bioMatch[3].trim();

          // Look for accomplishment in second sentence
          if (sentences.length > 1) {
            const accompMatch = sentences[1].match(/\b(became|led|founded|discovered|invented|created|wrote|fought|won|played)\s+([^.]+)/i);
            if (accompMatch) {
              components.context = accompMatch[0].trim();
            }
          }
        }
        break;

      case 'definition':
        // Extract: Term + category + distinguishing feature
        const defMatch = firstSentence.match(/^([A-Z][^,]+?)\s+(is|are|means)\s+(a|an|the)\s+([^,.]+?)(?:\s+(that|which)\s+([^.]+))?/i);
        if (defMatch) {
          components.subject = defMatch[1].trim();
          components.action = defMatch[2];
          components.object = defMatch[4].trim();
          components.context = defMatch[6] ? defMatch[6].trim() : null;
        }
        break;

      case 'event':
        // Extract: Time + Organization/Entity + Action + Context
        const timeMatch = text.match(/In\s+(the\s+)?(\d{4}[-–]\d{2,4})\s+([^,]+)/i);
        if (timeMatch) {
          components.time = timeMatch[2];
          components.context = timeMatch[3].trim();
        }

        const entityMatch = firstSentence.match(/([A-Z][A-Z.\s]+|[A-Z][a-z]+(?:\s+[A-Z][a-z.]+)+)\s+(competed|played|participated|fought|won|became)/i);
        if (entityMatch) {
          components.subject = entityMatch[1].trim();
          components.action = entityMatch[2].trim();
        }

        const objectMatch = firstSentence.match(/(?:in|at|for)\s+(the\s+)?([A-Z][^,.]+)/);
        if (objectMatch) {
          components.object = objectMatch[2].trim();
        }
        break;

      case 'process':
        // Extract: Goal + Method
        const processMatch = firstSentence.match(/^(To\s+[^,]+|The process of [^,]+)/i);
        if (processMatch) {
          components.subject = processMatch[1].trim();
        }
        components.action = 'involves';

        const methodMatch = text.match(/\b(requires|involves|uses|needs)\s+([^.]+)/i);
        if (methodMatch) {
          components.object = methodMatch[2].trim();
        }
        break;

      case 'causeEffect':
        // Extract: Cause + Effect
        const causeMatch = firstSentence.match(/^([^,]+),?\s+(because|since|led to|caused|resulted in)\s+([^.]+)/i);
        if (causeMatch) {
          components.subject = causeMatch[1].trim();
          components.action = causeMatch[2].trim();
          components.object = causeMatch[3].trim();
        }
        break;

      case 'formula':
        // Extract: What it calculates + the formula concept
        const formulaMatch = firstSentence.match(/^([^,]+?)\s+(equals|is|can be calculated)/i);
        if (formulaMatch) {
          components.subject = formulaMatch[1].trim();
          components.action = 'equals';
        }
        break;

      case 'general':
      default:
        // Extract: Subject + Main Verb + Object
        const generalMatch = firstSentence.match(/^([A-Z][^,]+?)\s+(is|are|was|were|has|have|does|do|can|could|will|would)\s+([^.]+)/i);
        if (generalMatch) {
          components.subject = generalMatch[1].trim();
          components.action = generalMatch[2].trim();
          components.object = generalMatch[3].trim();
        }
        break;
    }

    return components;
  }

  /**
   * Rebuild components into a complete, grammatically correct sentence
   * Adjust complexity based on tier
   */
  rebuildSentence(components, contentType, targetTier, originalText = '') {
    const { subject, action, object, context, time, place } = components;

    if (!subject && !action) {
      // Fallback: Just clean up the first sentence
      const sentences = originalText.match(/[^.!?]+[.!?]+/g) || [originalText];
      return sentences[0] ? sentences[0].trim() : originalText;
    }

    let result = '';

    switch (contentType) {
      case 'biography':
        if (targetTier === 'tier1') {
          // Tier 1: Just "Name was a [profession]"
          result = `${subject} ${action} a ${object}.`;
        } else {
          // Tier 2: Add key accomplishment if available
          result = `${subject} ${action} a ${object}`;
          if (context) {
            result += ` who ${context}`;
          }
          result += '.';
        }
        break;

      case 'definition':
        if (targetTier === 'tier1') {
          // Tier 1: Just the category
          result = `${subject} ${action} a ${object}.`;
        } else {
          // Tier 2: Add distinguishing feature
          result = `${subject} ${action} a ${object}`;
          if (context) {
            result += ` that ${context}`;
          }
          result += '.';
        }
        break;

      case 'event':
        if (targetTier === 'tier1') {
          // Tier 1: Just entity + simple action + time
          const simpleTime = time ? time.substring(0, 4) : 'that year';
          result = `${subject} ${action} in ${simpleTime}.`;
        } else {
          // Tier 2: Entity + action + competition/context + time
          result = `${subject} ${action} in`;
          if (object) {
            result += ` ${object}`;
          }
          if (time) {
            result += ` in ${time}`;
          }
          result += '.';
        }
        break;

      case 'process':
        if (targetTier === 'tier1') {
          // Tier 1: Simplified goal
          const simpleGoal = subject.replace(/^To\s+/i, '').replace(/^The process of\s+/i, '');
          result = `This is about ${simpleGoal}.`;
        } else {
          // Tier 2: Goal + method
          result = `${subject} ${action}`;
          if (object) {
            result += ` ${object}`;
          }
          result += '.';
        }
        break;

      case 'causeEffect':
        if (targetTier === 'tier1') {
          // Tier 1: Simple cause-effect
          const simpleAction = action.replace(/led to|resulted in/, 'caused');
          result = `${subject} ${simpleAction} ${object}.`;
        } else {
          // Tier 2: Full cause-effect
          result = `${subject} ${action} ${object}.`;
        }
        break;

      case 'formula':
        // Both tiers: Keep formula simple
        result = `${subject} ${action}`;
        if (object) {
          result += ` ${object}`;
        }
        result += '.';
        break;

      case 'general':
      default:
        result = `${subject} ${action} ${object}.`;
        break;
    }

    // Clean up
    result = result.replace(/\s+/g, ' ').trim();
    result = result.replace(/\s+\./g, '.');
    result = result.replace(/\.\./g, '.');

    return result;
  }

  /**
   * Simplify vocabulary based on tier
   * Tier 1: Elementary vocabulary (K-2)
   * Tier 2: Intermediate vocabulary (3-5)
   */
  simplifyVocabulary(text, glossaryTerms, targetTier) {
    let result = text;

    // Tier-specific word replacements
    const tier1Replacements = {
      // Sports/Competition
      'competed': 'played',
      'participated': 'joined',
      'division': 'group',
      'league': 'group',
      'season': 'year',
      'tier': 'level',

      // Academic
      'refers to': 'means',
      'defined as': 'means',
      'indicates': 'shows',
      'demonstrates': 'shows',
      'illustrates': 'shows',
      'approximately': 'about',
      'sufficient': 'enough',
      'obtain': 'get',
      'utilize': 'use',
      'possess': 'have',

      // Biography
      'renowned': 'famous',
      'acclaimed': 'famous',
      'notable': 'important',
      'prominent': 'important',
      'accomplished': 'did',

      // Time
      'subsequently': 'later',
      'previously': 'before',
      'currently': 'now',
      'initially': 'first',

      // General
      'numerous': 'many',
      'various': 'many',
      'significant': 'important',
      'essential': 'needed',
      'fundamental': 'basic',
      'primary': 'main',
      'additional': 'more',
      'alternative': 'other'
    };

    const tier2Replacements = {
      // Keep more academic words but simplify complex ones
      'aforementioned': 'mentioned',
      'subsequently': 'then',
      'nevertheless': 'but',
      'furthermore': 'also',
      'consequently': 'so',
      'approximately': 'about',
      'sufficient': 'enough'
    };

    const replacements = targetTier === 'tier1' ? tier1Replacements : tier2Replacements;

    for (const [complex, simple] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      result = result.replace(regex, simple);
    }

    return result;
  }

  // Keep these utility methods for the glossary feature
  getEstimatedSyllables(word) {
    if (word.length <= 3) return 1;
    word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  countSyllables(sentence) {
    const words = sentence.toLowerCase().match(/\b[a-z]+\b/g) || [];
    let count = 0;
    for (const word of words) {
      if (word.length > 0) {
        count += this.getEstimatedSyllables(word);
      }
    }
    return Math.max(1, count);
  }
}

// Export to global namespace
window.LanguageBridgeSimplificationService = new LanguageBridgeSimplificationService();
