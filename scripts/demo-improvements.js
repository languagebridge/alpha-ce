/**
 * Demo the tier differentiation improvements
 * Uses real academic text examples
 */

const fs = require('fs');
const vocabularyData = JSON.parse(fs.readFileSync('./plain_english_a_to_z-1.json', 'utf8'));

// Mock logger
global.logger = { log: () => {}, warn: () => {}, error: () => {} };

const TieredVocabularySimplifier = require('../content/tiered-vocabulary-simplifier.js');
const simplifier = new TieredVocabularySimplifier(vocabularyData);

// Real academic sentences
const examples = [
  "The researchers will analyze the data to identify significant patterns.",
  "Students must comprehend fundamental concepts before proceeding to advanced topics.",
  "The study commenced with an investigation of various factors that contribute to the phenomenon.",
  "Scientists detect minute changes through specialized equipment and systematic observation.",
  "The primary objective is to establish a comprehensive framework for understanding the process."
];

console.log('=== TIER DIFFERENTIATION IMPROVEMENTS ===\n');
console.log('Showing how TIER 1 uses more basic vocabulary than TIER 2\n');
console.log('='.repeat(80) + '\n');

examples.forEach((text, i) => {
  console.log(`Example ${i + 1}:`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`TIER 3 (Original Academic Text):`);
  console.log(`  ${text}\n`);

  const tier2 = simplifier.simplifyText(text, 'tier2');
  console.log(`TIER 2 (Academic Vocabulary - for building college readiness):`);
  console.log(`  ${tier2}\n`);

  const tier1 = simplifier.simplifyText(text, 'tier1');
  console.log(`TIER 1 (Basic Vocabulary - most accessible):`);
  console.log(`  ${tier1}\n`);

  // Highlight key differences
  console.log(`Key Simplifications:`);

  // Simple word-by-word comparison
  const tier3Words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const tier2Words = tier2.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const tier1Words = tier1.toLowerCase().match(/\b[a-z]+\b/g) || [];

  // Find academic words that were replaced
  const academicWords = ['analyze', 'comprehend', 'fundamental', 'commence', 'detect', 'identify', 'significant', 'investigate', 'various', 'contribute', 'establish', 'comprehensive', 'primary', 'objective'];

  const foundReplacements = [];
  tier3Words.forEach((word, idx) => {
    if (academicWords.includes(word)) {
      foundReplacements.push({
        original: word,
        tier2: tier2Words[idx] || '?',
        tier1: tier1Words[idx] || '?'
      });
    }
  });

  if (foundReplacements.length > 0) {
    foundReplacements.forEach(r => {
      console.log(`  • "${r.original}" → TIER2: "${r.tier2}" → TIER1: "${r.tier1}"`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
});

console.log('SUMMARY:');
console.log('  • TIER 3: Original academic vocabulary (for advanced students)');
console.log('  • TIER 2: Academic simplification (builds college-ready vocabulary)');
console.log('  • TIER 1: Maximum simplification (most accessible for beginners)');
console.log('\n' + '='.repeat(80));
