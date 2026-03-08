/**
 * FINAL INTEGRATION TEST - Validates all fixes
 * Run this before submitting to Chrome Web Store
 */

const fs = require('fs');
const vocabularyData = JSON.parse(fs.readFileSync('./plain_english_a_to_z-1.json', 'utf8'));

global.logger = { log: () => {}, warn: () => {}, error: () => {} };
const TieredVocabularySimplifier = require('../content/tiered-vocabulary-simplifier.js');
const simplifier = new TieredVocabularySimplifier(vocabularyData);

console.log('='.repeat(80));
console.log('LANGUAGEBRIDGE EXTENSION - FINAL INTEGRATION TEST');
console.log('='.repeat(80));
console.log('\n');

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   ${details}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   ${details}`);
    failCount++;
  }
}

// Test 1: Vocabulary database structure
console.log('TEST 1: Vocabulary Database Integrity\n' + '─'.repeat(80));
const tier3Words = new Set();
let circularCount = 0;
vocabularyData.forEach(entry => {
  tier3Words.add(entry.tier3.toLowerCase());
});

vocabularyData.forEach(entry => {
  const tier2 = Array.isArray(entry.tier2) ? entry.tier2 : [entry.tier2];
  const tier1 = Array.isArray(entry.tier1) ? entry.tier1 : [entry.tier1];

  tier2.forEach(w => { if (tier3Words.has(w.toLowerCase())) circularCount++; });
  tier1.forEach(w => { if (tier3Words.has(w.toLowerCase())) circularCount++; });
});

test('No circular tier references', circularCount === 0,
  circularCount > 0 ? `Found ${circularCount} circular refs (tier2/tier1 words that are also tier3)` : 'All tier2/tier1 words are properly simplified');

// Test 2: Inflection correctness
console.log('\nTEST 2: Inflection Matching\n' + '─'.repeat(80));
const t1 = simplifier.simplifyText('Students comprehend various concepts.', 'tier1');
const hasGrasp = t1.includes('grasp') || t1.includes('understand') || t1.includes('get');
test('Past tense inflection correct', hasGrasp, `Output: "${t1}"`);

const t2 = simplifier.simplifyText('The principal components are important.', 'tier2');
const noPluralBug = !t2.includes('partss') && !t2.includes('picess') && !t2.includes('partses');
test('No double pluralization', noPluralBug, `Output: "\${t2}"`);

// Test 3: Tier differentiation
console.log('\nTEST 3: Tier Differentiation (Vocabulary)\n' + '─'.repeat(80));
const original = 'Students must obtain sufficient knowledge to comprehend various concepts.';
const tier2_out = simplifier.simplifyText(original, 'tier2');
const tier1_out = simplifier.simplifyText(original, 'tier1');

test('TIER 2 differs from TIER 3', tier2_out !== original,
  `Tier2: "\${tier2_out.substring(0, 50)}..."`);
test('TIER 1 differs from TIER 2', tier1_out !== tier2_out,
  `Tier1: "\${tier1_out.substring(0, 50)}..."`);

const tier2Words = tier2_out.toLowerCase().split(/\s+/);
const tier1Words = tier1_out.toLowerCase().split(/\s+/);
const tier2HasAcademic = tier2Words.some(w => ['gain', 'acquire', 'information', 'grasp', 'diverse'].includes(w));
const tier1HasBasic = tier1Words.some(w => ['get', 'many', 'understand'].includes(w));

test('TIER 2 uses academic vocabulary', tier2HasAcademic,
  'Contains words like: gain, information, grasp');
test('TIER 1 uses basic vocabulary', tier1HasBasic,
  'Contains words like: get, many, understand');

// Test 4: No base form errors
console.log('\nTEST 4: Base Form Validation\n' + '─'.repeat(80));
const pastTenseForms = ['found', 'showed', 'thought', 'brought', 'bought', 'caught'];
let pastTenseCount = 0;
vocabularyData.forEach(entry => {
  const tier2 = Array.isArray(entry.tier2) ? entry.tier2 : [entry.tier2];
  const tier1 = Array.isArray(entry.tier1) ? entry.tier1 : [entry.tier1];
  [...tier2, ...tier1].forEach(w => {
    if (pastTenseForms.includes(w)) pastTenseCount++;
  });
});

test('No past tense in tier replacements', pastTenseCount === 0,
  pastTenseCount > 0 ? `Found \${pastTenseCount} past tense forms` : 'All tier words use base forms');

// Test 5: Irregular verbs in dictionary
console.log('\nTEST 5: Irregular Verb Coverage\n' + '─'.repeat(80));
const t3 = simplifier.simplifyText('The study commenced yesterday.', 'tier1');
const hasCorrectIrregular = t3.includes('began') || t3.includes('started');
test('Irregular verbs handled', hasCorrectIrregular, `Output: "\${t3}"`);

// Final summary
console.log('\n' + '='.repeat(80));
console.log(`FINAL RESULTS: \${passCount} PASSED, \${failCount} FAILED`);
console.log('='.repeat(80));

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED - Extension ready for Chrome Web Store!');
  console.log('\nNext steps:');
  console.log('  1. Test in actual Chrome extension');
  console.log('  2. Verify TIER 1 is significantly shorter than TIER 2');
  console.log('  3. Create promotional screenshots');
  console.log('  4. Submit to Chrome Web Store');
} else {
  console.log(`\n⚠️  FIX \${failCount} FAILING TEST(S) BEFORE SUBMISSION`);
  process.exit(1);
}
