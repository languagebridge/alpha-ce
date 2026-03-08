/**
 * SAFE version: Fix only clearly inflected base forms in vocabulary database
 * Only converts tier3 words that are DEFINITELY inflected (past tense -ed, clear plurals)
 */

const fs = require('fs');
const path = require('path');

// Read the vocabulary data
const vocabPath = path.join(__dirname, '..', 'plain_english_a_to_z-1.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

// CONSERVATIVE manual corrections for definitely inflected words
// Only include words we're 100% certain about
const corrections = {
  // -ed past tense forms (verbs)
  'anticipated': 'anticipate',
  'assigned': 'assign',
  'attached': 'attach',
  'attained': 'attain',
  'attributed': 'attribute',
  'compiled': 'compile',
  'confined': 'confine',
  'confirmed': 'confirm',
  'converted': 'convert',
  'convinced': 'convince',
  'derived': 'derive',
  'detected': 'detect',
  'devoted': 'devote',
  'diminished': 'diminish',
  'emerged': 'emerge',
  'generated': 'generate',
  'granted': 'grant',
  'highlighted': 'highlight',
  'identified': 'identify',
  'imposed': 'impose',
  'incorporated': 'incorporate',
  'induced': 'induce',
  'inferred': 'infer',
  'involved': 'involve',
  'isolated': 'isolate',
  'perceived': 'perceive',
  'illustrated': 'illustrate',

  // Clear plurals (nouns)
  'attitudes': 'attitude',
  'categories': 'category',
  'circumstances': 'circumstance',
  'colleagues': 'colleague',
  'components': 'component',
  'consequences': 'consequence',
  'constraints': 'constraint',
  'dimensions': 'dimension',
  'elements': 'element',
  'fluctuations': 'fluctuation',
  'funds': 'fund',
  'goals': 'goal',
  'guidelines': 'guideline',
  'implications': 'implication',
  'initiatives': 'initiative',
  'instructions': 'instruction',
  'issues': 'issue',
  'items': 'item',
  'norms': 'norm',
  'parameters': 'parameter'
};

let changeCount = 0;
const changes = [];

// Fix each entry
data.forEach((entry, index) => {
  const original = entry.tier3;

  if (corrections[original]) {
    const newBase = corrections[original];
    entry.tier3 = newBase;
    changes.push({ index, original, new: newBase });
    changeCount++;
  }
});

// Write back
fs.writeFileSync(vocabPath, JSON.stringify(data, null, 2), 'utf8');

// Show what we changed
console.log('Fixed inflected base forms:\n');
changes.forEach(c => {
  console.log(`  ${c.original} → ${c.new}`);
});
console.log(`\n✓ Fixed ${changeCount} inflected base forms`);
console.log(`✓ Vocabulary database updated: ${vocabPath}`);
