/**
 * Restore damaged vocabulary entries
 * Fixes entries that were incorrectly stemmed
 */

const fs = require('fs');
const path = require('path');

// Read the vocabulary data
const vocabPath = path.join(__dirname, '..', 'plain_english_a_to_z-1.json');
const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

// Map of damaged → correct
const restorations = {
  'analysi': 'analysis',
  'obviou': 'obvious',
  'variou': 'various',
  'emphasi': 'emphasis',
  'hypothesi': 'hypothesis',
  'thesi': 'thesis',
  'focu': 'focus',
  'exce': 'exceed',
  'issu': 'issue',
  'sery': 'series',
  'previou': 'previous',
  'rigorou': 'rigorous',
  'ambiguou': 'ambiguous',
  'grante': 'grant', // Should be base form
  'highlighte': 'highlight', // Should be base form
  'inferred': 'infer', // Should be base form
  'initiativ': 'initiative',
  'guidelin': 'guideline'
};

let fixCount = 0;

data.forEach(entry => {
  const original = entry.tier3;

  if (restorations[original]) {
    entry.tier3 = restorations[original];
    console.log(`✓ Restored: ${original} → ${entry.tier3}`);
    fixCount++;
  }
});

// Write back
fs.writeFileSync(vocabPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`\n✓ Restored ${fixCount} damaged entries`);
