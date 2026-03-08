/**
 * Test tier differentiation with sample academic text
 * Shows how tier1 vs tier2 produce different outputs
 */

// Load the tiered simplifier
const fs = require('fs');
const vocabularyData = JSON.parse(fs.readFileSync('./plain_english_a_to_z-1.json', 'utf8'));

// Mock logger for Node.js
global.logger = {
  log: () => {},
  warn: () => {},
  error: () => {}
};

// Load the simplifier class
const TieredVocabularySimplifier = require('../content/tiered-vocabulary-simplifier.js');

// Create instance
const simplifier = new TieredVocabularySimplifier(vocabularyData);

// Test sentences with academic vocabulary
const testSentences = [
  "Students must obtain sufficient knowledge to comprehend various concepts.",
  "The primary element of the research was to analyze significant factors.",
  "Teachers provide assistance to help students perceive fundamental principles.",
  "Scientists utilize specialized equipment to detect and classify elements.",
  "The study commenced with a brief overview of the principal components."
];

console.log('=== TIER DIFFERENTIATION TEST ===\n');

testSentences.forEach((original, i) => {
  console.log(`\nTest ${i + 1}:`);
  console.log(`TIER 3 (Original): ${original}`);

  const tier2 = simplifier.simplifyText(original, 'tier2');
  console.log(`TIER 2 (Academic): ${tier2}`);

  const tier1 = simplifier.simplifyText(original, 'tier1');
  console.log(`TIER 1 (Basic):    ${tier1}`);

  // Check if they're different
  if (tier1 === tier2) {
    console.log('  ⚠️ WARNING: tier1 and tier2 are IDENTICAL');
  } else if (tier1 === original && tier2 === original) {
    console.log('  ⚠️ WARNING: No simplification occurred');
  } else {
    console.log('  ✓ Tiers are distinct');
  }
});

console.log('\n\n=== VOCABULARY STATS ===');
const stats = simplifier.getStats();
console.log(`Total academic terms: ${stats.totalEntries}`);
console.log(`Total tier2 words: ${stats.tier2Words}`);
console.log(`Database loaded: ${stats.hasData ? 'Yes' : 'No'}`);
